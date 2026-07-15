import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db, accounts, sessions, users, verificationTokens } from "@pathfinder/core"
import { toScannerSafeVerificationUrl } from "@/lib/magic-link"
import { consumeVerificationToken } from "@/lib/verification-token"
import { emitOperationalEvent } from "@/lib/telemetry"

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
})

const resendProvider = Resend({
  name: "Email",
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.AUTH_RESEND_FROM || "pathfinder@windwardline.com",
  maxAge: 15 * 60,
})

const sendVerificationRequest = resendProvider.sendVerificationRequest
resendProvider.sendVerificationRequest = async params => {
  const correlation = crypto.randomUUID()
  const startedAt = performance.now()
  try {
    const result = await sendVerificationRequest({
      ...params,
      url: toScannerSafeVerificationUrl(params.url),
    })
    emitOperationalEvent({
      correlationId: correlation,
      service: "authentication",
      operation: "magic_link_request",
      outcome: "success",
      durationMs: performance.now() - startedAt,
    })
    return result
  } catch (error) {
    emitOperationalEvent({
      correlationId: correlation,
      service: "authentication",
      operation: "magic_link_request",
      outcome: "failure",
      durationMs: performance.now() - startedAt,
    })
    throw error
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...baseAdapter,
    // Auth.js requires this operation to be atomic and single-use. Email
    // scanners receive the inert /verify landing URL instead of this callback,
    // so scanner compatibility does not weaken replay protection.
    useVerificationToken: ({ identifier, token }) =>
      consumeVerificationToken(identifier, token),
  },
  providers: [
    resendProvider,
  ],
  pages: {
    signIn: "/signin",
    verifyRequest: "/check-email",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
