import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/prisma"
import { SignJWT, jwtVerify } from "jose"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  jwt: {
    async encode({ secret, token }) {
      const secretKey = new TextEncoder().encode(secret as string)
      return new SignJWT(token as any)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(secretKey)
    },
    async decode({ secret, token }) {
      if (!token) return null
      try {
        const secretKey = new TextEncoder().encode(secret as string)
        const { payload } = await jwtVerify(token, secretKey)
        return payload
      } catch (e) {
        return null
      }
    }
  }
})