"use server"

import { headers } from "next/headers"

import type { SubmissionResult } from "../application/inquiry-service"
import { inquiries } from "./inquiries"

const clientIp = (forwardedFor: string | null, realIp: string | null) =>
  forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"

export async function submitInquiry(
  _previous: SubmissionResult | null,
  formData: FormData
): Promise<SubmissionResult> {
  const requestHeaders = await headers()
  return inquiries.submit(Object.fromEntries(formData), {
    ip: clientIp(
      requestHeaders.get("x-forwarded-for"),
      requestHeaders.get("x-real-ip")
    ),
    userAgent: requestHeaders.get("user-agent") ?? "",
  })
}
