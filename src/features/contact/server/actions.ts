"use server"

import { headers } from "next/headers"

import { clientContext } from "@/lib/security/request-context"

import type { SubmissionResult } from "../application/inquiry-service"
import { inquiries } from "./inquiries"

export async function submitInquiry(
  _previous: SubmissionResult | null,
  formData: FormData
): Promise<SubmissionResult> {
  const { ip, userAgent } = clientContext(await headers())
  return inquiries.submit(Object.fromEntries(formData), {
    ip: ip || "unknown",
    userAgent,
  })
}
