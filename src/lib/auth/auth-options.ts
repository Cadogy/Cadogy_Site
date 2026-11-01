import { User } from "@/models/User"
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import { verifyPassword } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyTurnstile } from "@/lib/security/turnstile"

import { authorizeCredentials } from "./credentials"
import { safeCallbackPath } from "./safe-redirect"

const isProduction = process.env.NODE_ENV === "production"
const cookiePrefix = isProduction ? "__Secure-" : ""

const cookie = (name: string) => ({
  name: `${cookiePrefix}next-auth.${name}`,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: isProduction,
    domain: isProduction ? ".cadogy.com" : undefined,
  },
})

const clientIp = (headers: Record<string, unknown> | undefined) => {
  const forwarded = headers?.["x-forwarded-for"]
  return typeof forwarded === "string"
    ? (forwarded.split(",")[0]?.trim() ?? "")
    : ""
}

const findUserByEmail = async (email: string) => {
  await connectToDatabase()
  const user = await User.findOne({ email }).lean()
  if (!user) return null
  return {
    id: String(user._id),
    name: user.name ?? null,
    email: user.email,
    image: user.image ?? null,
    role: user.role === "admin" ? ("admin" as const) : ("user" as const),
    passwordHash: user.password ?? null,
    emailVerified: user.emailVerified ?? null,
  }
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: cookie("session-token"),
    callbackUrl: cookie("callback-url"),
    csrfToken: {
      name: `${isProduction ? "__Host-" : ""}next-auth.csrf-token`,
      options: { ...cookie("csrf-token").options, domain: undefined },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        turnstileToken: { label: "Verification", type: "text" },
      },
      authorize: (credentials, request) =>
        authorizeCredentials(credentials, clientIp(request?.headers), {
          verifyTurnstile,
          findUserByEmail,
          verifyPassword,
        }),
    }),
  ],
  pages: { signIn: "/login", error: "/login", newUser: "/register" },
  callbacks: {
    jwt: ({ token, user }) =>
      user ? { ...token, id: user.id, role: user.role } : token,
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: String(token.id ?? token.sub ?? ""),
        role: token.role === "admin" ? "admin" : "user",
        name: token.name ?? "",
        email: token.email ?? "",
        image: typeof token.picture === "string" ? token.picture : undefined,
      },
    }),
    redirect: ({ url, baseUrl }) =>
      `${baseUrl}${safeCallbackPath(url, baseUrl)}`,
  },
}
