import NextAuth, { type NextAuthConfig } from "next-auth"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db, accounts, sessions, users, verificationTokens } from "@pathfinder/core"
import { toScannerSafeVerificationUrl } from "@/lib/magic-link"
import { MAGIC_LINK_FROM, magicLinkEmail } from "@/lib/auth-email"
import { consumeVerificationToken } from "@/lib/verification-token"
import { emitOperationalEvent } from "@/lib/telemetry"
import { suppressionStatus } from "@/lib/suppression"

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
})

// Exported so tests can resolve it exactly as Auth.js does and pin the URL
// that actually reaches the email template.
export const resendProvider = Resend({
  name: "Email",
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.AUTH_RESEND_FROM || MAGIC_LINK_FROM,
  maxAge: 15 * 60,
  // Everything the send needs lives in this one function. Auth.js keeps the
  // config object passed here on `provider.options` and merges it *over* the
  // provider's own defaults (@auth/core parseProviders), so a
  // `sendVerificationRequest` assigned to the provider afterwards is silently
  // discarded — the URL rewrite and telemetry have to be inside this function
  // to run at all.
  async sendVerificationRequest({ identifier, url, provider }) {
    const correlationId = crypto.randomUUID()
    const startedAt = performance.now()
    try {
      // A suppressed recipient is accepted by Resend and delivered to nobody,
      // so this has to be asked BEFORE the send rather than read off its
      // response. The sign-in form asks the same question to produce better
      // copy; this one is the authoritative guard, because it sits on the only
      // code path that can actually send, and any future caller of
      // signIn('resend') inherits it without knowing it exists.
      const suppression = await suppressionStatus(provider.apiKey, identifier)
      if (suppression === 'suppressed') {
        emitOperationalEvent({
          correlationId,
          service: "authentication",
          operation: "magic_link_request",
          outcome: "rejected",
          durationMs: performance.now() - startedAt,
        })
        // Never the address: the telemetry contract excludes it on purpose.
        throw new Error(
          "Resend suppression: recipient is blocked from delivery. " +
            "Sending would be accepted and silently dropped.",
        )
      }
      if (suppression === 'unknown') {
        // The check failed open so sign-in still works. It must not fail
        // quietly as well, or the guard's own outage is the new invisible one.
        emitOperationalEvent({
          correlationId,
          service: "authentication",
          operation: "magic_link_request",
          outcome: "rejected",
          severity: "warning",
          durationMs: performance.now() - startedAt,
        })
      }

      // Email scanners only ever see the inert /verify landing page; the real
      // callback stays behind the user's form submission.
      const { subject, html, text } = magicLinkEmail(toScannerSafeVerificationUrl(url))
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
      emitOperationalEvent({
        correlationId,
        service: "authentication",
        operation: "magic_link_request",
        outcome: "success",
        durationMs: performance.now() - startedAt,
      })
    } catch (error) {
      emitOperationalEvent({
        correlationId,
        service: "authentication",
        operation: "magic_link_request",
        outcome: "failure",
        durationMs: performance.now() - startedAt,
      })
      throw error
    }
  },
})

// Named so tests can assert the routing Auth.js is given, rather than the
// routing it falls back to.
export const authConfig = {
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
    // Without this, a failed send or a spent link lands on the stock Auth.js
    // error page; /signin already carries the copy for both.
    error: "/signin",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
} satisfies NextAuthConfig

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig)
