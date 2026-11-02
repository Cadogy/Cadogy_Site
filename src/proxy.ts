import { NextResponse, type NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

import { isSameOriginRequest } from "@/lib/security/request-origin"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const ORIGIN_CHECK_EXEMPT = ["/api/webhooks/"]
const SIGNED_IN_AREAS = ["/dashboard", "/admin"]

const isUnder = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`)

const guardApi = (request: NextRequest, pathname: string) => {
  const needsOriginCheck =
    !SAFE_METHODS.has(request.method) &&
    !ORIGIN_CHECK_EXEMPT.some((prefix) => pathname.startsWith(prefix))
  if (needsOriginCheck && !isSameOriginRequest(request))
    return NextResponse.json(
      { error: "Cross-origin request rejected" },
      { status: 403 }
    )
  return NextResponse.next()
}

const guardPage = (request: NextRequest, pathname: string) => {
  const signedInArea = SIGNED_IN_AREAS.some((area) => isUnder(pathname, area))
  if (!signedInArea) return NextResponse.next()
  if (getSessionCookie(request, { cookiePrefix: "cadogy" }))
    return NextResponse.next()
  const login = new URL("/login", request.url)
  login.searchParams.set("callbackUrl", pathname)
  return NextResponse.redirect(login)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  return pathname.startsWith("/api/")
    ? guardApi(request, pathname)
    : guardPage(request, pathname)
}
