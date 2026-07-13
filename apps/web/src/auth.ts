import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db, accounts, sessions, users, verificationTokens } from "@pathfinder/core"
import { eq, and, lt } from "drizzle-orm"

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...baseAdapter,
    // Enterprise email scanners pre-fetch magic links, which consumes a
    // single-use token before the user can click it. We therefore look the
    // token up without deleting it, but enforce expiry ourselves and keep the
    // provider's token lifetime short (15 minutes, below) to bound replay.
    useVerificationToken: async ({ identifier, token }) => {
      // Opportunistic cleanup so stale tokens don't accumulate.
      try {
        await db
          .delete(verificationTokens)
          .where(lt(verificationTokens.expires, new Date()))
      } catch (e) {
        console.error("Verification token cleanup failed:", e)
      }

      const result = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        )

      const found = result[0]
      if (!found || found.expires < new Date()) {
        return null
      }
      return found
    },
  },
  providers: [
    Resend({
      name: "Email",
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_RESEND_FROM || "pathfinder@windwardline.com",
      maxAge: 15 * 60, // magic links stay valid for 15 minutes
    }),
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
