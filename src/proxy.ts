import { NextResponse, type NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

import { isSameOriginRequest } from "@/lib/security/request-origin"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const ORIGIN_CHECK_EXEMPT = ["/api/webhooks/", "/api/uploadthing"]
const SESSION_API_PREFIXES = ["/api/dashboard/", "/api/user/", "/api/settings/"]

const startsWithAny = (pathname: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => pathname.startsWith(prefix))

const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`)

const json = (status: number, error: string) =>
  NextResponse.json({ error }, { status })

const readRole = async (request: NextRequest) => {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  })
  if (!token) return null
  return token.role === "admin" ? "admin" : "user"
}

const redirectTo = (request: NextRequest, pathname: string) =>
  NextResponse.redirect(new URL(pathname, request.url))

const redirectToLogin = (request: NextRequest) => {
  const url = new URL("/login", request.url)
  url.searchParams.set("callbackUrl", request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

const guardApi = async (request: NextRequest, pathname: string) => {
  const needsOriginCheck =
    !SAFE_METHODS.has(request.method) &&
    !startsWithAny(pathname, ORIGIN_CHECK_EXEMPT)
  if (needsOriginCheck && !isSameOriginRequest(request)) {
    return json(403, "Cross-origin request rejected")
  }

  if (pathname.startsWith("/api/admin/")) {
    const role = await readRole(request)
    if (!role) return json(401, "Unauthorized")
    if (role !== "admin") return json(403, "Forbidden")
  }

  if (startsWithAny(pathname, SESSION_API_PREFIXES)) {
    const role = await readRole(request)
    if (!role) return json(401, "Unauthorized")
  }

  return NextResponse.next()
}

const guardPage = async (request: NextRequest, pathname: string) => {
  if (isUnder(pathname, "/admin")) {
    const role = await readRole(request)
    if (!role) return redirectToLogin(request)
    if (role !== "admin") return redirectTo(request, "/dashboard")
  }

  if (isUnder(pathname, "/dashboard")) {
    const role = await readRole(request)
    if (!role) return redirectToLogin(request)
  }

  return NextResponse.next()
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/api/")) return guardApi(request, pathname)
  return guardPage(request, pathname)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.[a-z0-9]+$).*)",
  ],
}
