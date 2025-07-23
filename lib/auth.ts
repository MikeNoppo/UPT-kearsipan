import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          console.log("❌ Missing credentials")
          return null
        }

        try {
          console.log("🔍 Looking for user:", credentials.username)
          
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username
            }
          })

          if (!user) {
            console.log("❌ User not found")
            return null
          }

          console.log("✅ User found:", user.username, "Status:", user.status)

          // Check if user is active
          if (user.status !== 'ACTIVE') {
            console.log("❌ User not active")
            return null
          }

          // Compare hashed password
          console.log("🔐 Comparing passwords...")
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log("🔐 Password valid:", isPasswordValid)
          
          if (!isPasswordValid) {
            console.log("❌ Invalid password")
            return null
          }

          console.log("✅ Authentication successful for:", user.username)
          return {
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status
          }
        } catch (error) {
          console.error("❌ Auth error:", error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username: string }).username
        token.role = (user as { role: string }).role
        token.status = (user as { status: string }).status
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.status = token.status as string
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
