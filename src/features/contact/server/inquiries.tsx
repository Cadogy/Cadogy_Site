import "server-only"

import { env } from "@/env"
import { sendEmail } from "@/lib/email"
import { renderEmail } from "@/lib/email/render"
import { connectToDatabase } from "@/lib/mongodb"
import { hitRateLimit } from "@/lib/rate-limit"
import { verifyTurnstile } from "@/lib/security/turnstile"

import { createInquiryService } from "../application/inquiry-service"
import {
  BUDGETS,
  labelFor,
  PROJECT_TYPES,
  TIMELINES,
  type Inquiry,
} from "../domain/schema"
import { InquiryEmail } from "../email/inquiry-email"
import { InquiryModel } from "./models"

export const formSecret = () =>
  env.FORM_SIGNING_SECRET ?? env.BETTER_AUTH_SECRET

const notifyAdmin = async (inquiry: Inquiry) => {
  const details = [
    { label: "Email", value: inquiry.email },
    { label: "Company", value: inquiry.company || "—" },
    {
      label: "Looking for",
      value: labelFor(PROJECT_TYPES, inquiry.projectType),
    },
    { label: "Budget", value: labelFor(BUDGETS, inquiry.budget) },
    { label: "Timeline", value: labelFor(TIMELINES, inquiry.timeline) },
  ]
  const body = await renderEmail(
    <InquiryEmail
      baseUrl={env.NEXT_PUBLIC_APP_URL}
      name={inquiry.name}
      email={inquiry.email}
      details={details}
      message={inquiry.message}
    />
  )
  await sendEmail({
    to: env.ADMIN_NOTIFY_EMAIL,
    replyTo: inquiry.email,
    subject: `New inquiry: ${inquiry.name}${inquiry.company ? ` (${inquiry.company})` : ""}`,
    ...body,
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
