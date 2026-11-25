import { NextResponse, type NextRequest } from "next/server"
import { AUTH_COOKIE_PREFIX, loginPath } from "@/features/auth/domain/http"
import { getSessionCookie } from "better-auth/cookies"

import { SIGNED_IN_AREAS } from "@/config/signed-in-areas"
import { isSameOriginRequest } from "@/lib/security/request-origin"

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"])
const ORIGIN_CHECK_EXEMPT = ["/api/webhooks/"]

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
  if (getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX }))
    return NextResponse.next()
  return NextResponse.redirect(new URL(loginPath(pathname), request.url))
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  return pathname.startsWith("/api/")
    ? guardApi(request, pathname)
    : guardPage(request, pathname)
}
