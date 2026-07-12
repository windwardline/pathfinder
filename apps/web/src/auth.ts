import NextAuth from "next-auth"
import Resend from "next-auth/providers/resend"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { db, accounts, sessions, users, verificationTokens } from "@pathfinder/core"
import { eq, and } from "drizzle-orm"

const baseAdapter = DrizzleAdapter(db, {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: {
    ...baseAdapter,
    useVerificationToken: async ({ identifier, token }) => {
      try {
        // Look up the token without deleting it. This solves the infamous NextAuth
        // bug where enterprise email scanners (like Outlook/SES) pre-fetch the magic link 
        // and instantly consume the token, preventing the user from logging in.
        const result = await db
          .select()
          .from(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, identifier),
              eq(verificationTokens.token, token)
            )
          )
        return result[0] ?? null
      } catch (err) {
        throw new Error("No verification token found.")
      }
    },
  },
  providers: [
    Resend({
      name: "Email Magic Link",
      apiKey: process.env.RESEND_API_KEY,
      from: "pathfinder@windwardline.com", // Adjust domain to your verified Resend domain
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
