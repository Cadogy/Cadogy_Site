import "server-only"

import { randomBytes } from "node:crypto"

import { env } from "@/env"
import { sendEmail } from "@/lib/email"

import { createBillingService } from "../application/billing-service"
import { createCredits } from "../application/credits"
import { createBillingEngine } from "../application/engine"
import type { BillingNotifier } from "../application/ports"
import type { Invoice } from "../domain/invoice"
import { renderBillingEmail } from "../email/templates"
import { invoicePdfFilename, renderInvoicePdf } from "../pdf/invoice-pdf"
import { mongoCreditNoteRepository } from "./mongo-credit-notes"
import { mongoEngineRepository } from "./mongo-engine-repository"
import { mongoBillingRepository } from "./mongo-repository"
import { stripeGateway, stripeRefunds } from "./stripe"

/** The PDF is a courtesy: if it can't be made, the email still goes out. */
const pdfAttachment = async (invoice: Invoice) => {
  try {
    return {
      filename: invoicePdfFilename(invoice),
      content: await renderInvoicePdf(invoice),
    }
  } catch (error) {
    console.error(`[billing] PDF for ${invoice.number} failed`, error)
    return null
  }
}

const resendNotifier: BillingNotifier = {
  send: async ({ kind, invoice, recipients }) => {
    const attachment = await pdfAttachment(invoice)
    const email = await renderBillingEmail({
      kind,
      invoice,
      baseUrl: env.NEXT_PUBLIC_APP_URL,
      attached: attachment !== null,
    })
    await sendEmail({
      to: recipients,
      ...email,
      ...(attachment ? { attachments: [attachment] } : {}),
    })
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
  applyCredit: (invoiceId, actorId) => credits.applyBalance(invoiceId, actorId),
})
