import { NextResponse, type NextRequest } from "next/server"
import { billingEngine } from "@/features/billing/server/billing"

import { env } from "@/env"
import { hasBearerSecret } from "@/lib/security/bearer-secret"

export const dynamic = "force-dynamic"
export const maxDuration = 300

export async function GET(request: NextRequest) {
  if (
    !hasBearerSecret(request.headers.get("authorization"), env.CRON_SECRET)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const summary = await billingEngine.runBilling()
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  })
}
