import {
  Bug,
  MessageCircleQuestion,
  PencilRuler,
  Receipt,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import type { TICKET_CATEGORIES } from "../application/support-service"

export type Category = (typeof TICKET_CATEGORIES)[number]["value"]

/** How each category is presented: what it's for and what helps us answer. */
export const CATEGORY_GUIDE: Record<
  Category,
  {
    readonly icon: LucideIcon
    readonly blurb: string
    readonly subject: string
    readonly prompt: string
  }
> = {
  general: {
    icon: MessageCircleQuestion,
    blurb: "Anything about your project",
    subject: "e.g. Timeline for the next release",
    prompt: "Tell us what you need and any deadline we should know about.",
  },
  billing: {
    icon: Receipt,
    blurb: "Invoices, payments, autopay",
    subject: "e.g. Question about invoice INV-2026-0042",
    prompt:
      "Include the invoice number and what looks wrong or what you'd like changed.",
  },
  technical: {
    icon: Wrench,
    blurb: "Something isn't working",
    subject: "e.g. Checkout page won't load",
    prompt:
      "What were you doing, what happened, and when did it start? Links and screenshots help.",
  },
  "bug-report": {
    icon: Bug,
    blurb: "Report a defect",
    subject: "e.g. Totals are wrong when a discount is applied",
    prompt:
      "Steps to reproduce, what you expected, what happened instead, and your browser or device.",
  },
  "feature-request": {
    icon: PencilRuler,
    blurb: "Change or add something",
    subject: "e.g. Add CSV export to the orders page",
    prompt:
      "Describe the change and the problem it solves for you. We'll reply with scope and an estimate.",
  },
}
