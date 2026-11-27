import type { ActionState } from "@/lib/action-state"

import type { IssuedInvoice } from "../application/engine"

const EMAIL_FAILED =
  "the email to the client failed. Use “Email to billing contacts” on the invoice to try again"

const describe = ({ invoice, emailed, autopay }: IssuedInvoice) => {
  const usedCredit = invoice.payments.some(
    (payment) => payment.method === "credit"
  )
  return [
    usedCredit ? "Credit balance applied." : "",
    autopay === "collected" ? "Paid with the saved card." : "",
    autopay === "failed"
      ? "The saved card was declined; the client has been asked to pay."
      : "",
    emailed ? "" : `But ${EMAIL_FAILED}.`,
  ]
    .filter(Boolean)
    .join(" ")
}

/** One message for any issue path, honest about what actually happened. */
export const issuedFeedback = (
  issued: readonly IssuedInvoice[]
): NonNullable<ActionState> => {
  const failedEmails = issued.filter((entry) => !entry.emailed).length
  if (issued.length === 1 && issued[0]) {
    const entry = issued[0]
    return {
      ok: entry.emailed,
      message: [
        entry.emailed ? "Invoice issued and emailed." : "Invoice issued.",
        describe(entry),
      ]
        .filter(Boolean)
        .join(" "),
    }
  }
  return {
    ok: failedEmails === 0,
    message:
      failedEmails === 0
        ? `${issued.length} invoices issued and emailed.`
        : `${issued.length} invoices issued, but ${failedEmails} email${failedEmails === 1 ? "" : "s"} failed. Resend from each invoice.`,
  }
}

export const deliveryFeedback = (
  delivered: boolean,
  success: string
): NonNullable<ActionState> =>
  delivered
    ? { ok: true, message: success }
    : {
        ok: false,
        message:
          "The email couldn't be delivered. Check the client's billing contacts and try again.",
      }
