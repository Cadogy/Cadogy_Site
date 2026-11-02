import "server-only"

import { randomBytes } from "node:crypto"

import { env } from "@/env"
import { sendEmail } from "@/lib/email"

import { createBillingService } from "../application/billing-service"
import { createCredits } from "../application/credits"
import { createBillingEngine } from "../application/engine"
import type { BillingNotifier } from "../application/ports"
import { renderBillingEmail } from "../email/templates"
import { mongoCreditNoteRepository } from "./mongo-credit-notes"
import { mongoEngineRepository } from "./mongo-engine-repository"
import { mongoBillingRepository } from "./mongo-repository"
import { stripeGateway, stripeRefunds } from "./stripe"

const resendNotifier: BillingNotifier = {
  send: async ({ kind, invoice, recipients }) => {
    const email = renderBillingEmail({
      kind,
      invoice,
      baseUrl: env.NEXT_PUBLIC_APP_URL,
    })
    await sendEmail({ to: recipients, ...email })
  },
}

export const billing = createBillingService({
  repository: mongoBillingRepository,
  notifier: resendNotifier,
  clock: () => new Date(),
  generateToken: () => randomBytes(32).toString("base64url"),
})

export const credits = createCredits({
  billing,
  billingRepository: mongoBillingRepository,
  repository: mongoCreditNoteRepository,
  clock: () => new Date(),
  gateway: stripeRefunds,
})

export const billingEngine = createBillingEngine({
  billing,
  repository: mongoEngineRepository,
  gateway: stripeGateway,
  clock: () => new Date(),
  applyCredit: (invoiceId) => credits.applyBalance(invoiceId, "billing-run"),
})
