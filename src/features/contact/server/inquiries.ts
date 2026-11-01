import "server-only"

import { env } from "@/env"
import { sendEmail } from "@/lib/email"
import { emailLayout, escapeHtml } from "@/lib/email/html"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyTurnstile } from "@/lib/security/turnstile"

import { createInquiryService } from "../application/inquiry-service"
import {
  BUDGETS,
  labelFor,
  PROJECT_TYPES,
  TIMELINES,
  type Inquiry,
} from "../domain/schema"
import { InquiryModel, RateLimitModel } from "./models"

export const formSecret = () => env.FORM_SIGNING_SECRET ?? env.NEXTAUTH_SECRET

const hitRateLimit = async (key: string, windowMs: number) => {
  await connectToDatabase()
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs
  const bucket = await RateLimitModel.findOneAndUpdate(
    { _id: `${key}:${windowStart}` },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(windowStart + windowMs) },
    },
    { upsert: true, new: true }
  ).lean()
  return bucket?.count ?? 1
}

const notifyAdmin = async (inquiry: Inquiry) => {
  const rows: [string, string][] = [
    ["Name", inquiry.name],
    ["Email", inquiry.email],
    ["Company", inquiry.company || "—"],
    ["Looking for", labelFor(PROJECT_TYPES, inquiry.projectType)],
    ["Budget", labelFor(BUDGETS, inquiry.budget)],
    ["Timeline", labelFor(TIMELINES, inquiry.timeline)],
  ]
  await sendEmail({
    to: env.ADMIN_NOTIFY_EMAIL,
    replyTo: inquiry.email,
    subject: `New inquiry: ${inquiry.name}${inquiry.company ? ` (${inquiry.company})` : ""}`,
    html: emailLayout({
      baseUrl: env.NEXT_PUBLIC_APP_URL,
      preheader: inquiry.message.slice(0, 120),
      body: `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${rows
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 12px 4px 0;color:#71717a;white-space:nowrap;">${label}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`
        )
        .join(
          ""
        )}</table><p style="margin:0;white-space:pre-wrap;">${escapeHtml(inquiry.message)}</p>`,
    }),
    text: `${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${inquiry.message}`,
  })
}

export const inquiries = createInquiryService({
  clock: () => new Date(),
  formSecret: formSecret(),
  verifyTurnstile,
  rateLimiter: { hit: hitRateLimit },
  store: {
    save: async (inquiry) => {
      await connectToDatabase()
      await InquiryModel.create(inquiry)
    },
  },
  notifyAdmin,
})
