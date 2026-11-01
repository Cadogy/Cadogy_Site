import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      role: "user" | "admin"
    } & Omit<NonNullable<DefaultSession["user"]>, "name" | "email" | "image">
  }

  interface User {
    id: string
    role?: "user" | "admin"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: "user" | "admin"
  }
}
