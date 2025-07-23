import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      name: string
      email: string
      role: string
      status: string
    }
  }

  interface User {
    id: string
    username: string
    name: string
    email: string
    role: string
    status: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    username: string
    role: string
    status: string
  }
}
