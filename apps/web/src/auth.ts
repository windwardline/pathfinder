import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db, accounts, sessions, users, verificationTokens } from "@pathfinder/core"
import { toScannerSafeVerificationUrl } from "@/lib/magic-link"
import { MAGIC_LINK_FROM, magicLinkEmail } from "@/lib/auth-email"
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
  from: process.env.AUTH_RESEND_FROM || MAGIC_LINK_FROM,
  maxAge: 15 * 60,
  // House email template instead of the stock Auth.js one; the telemetry
  // wrapper below hands this the scanner-safe /verify URL.
  async sendVerificationRequest({ identifier, url, provider }) {
    const { subject, html, text } = magicLinkEmail(url)
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: provider.from, to: identifier, subject, html, text }),
    })
    if (!res.ok) {
      throw new Error(`Resend send failed: ${res.status} ${await res.text()}`)
    }
  },
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
