import {
  invoicePdfFilename,
  renderInvoicePdf,
} from "@/features/billing/pdf/invoice-pdf"
import { billing } from "@/features/billing/server/billing"

type Context = { params: Promise<{ token: string }> }

/** The invoice as a PDF, for anyone holding the invoice link. */
export async function GET(_request: Request, { params }: Context) {
  const { token } = await params
  const invoice = await billing.getByPublicToken(token)
  if (!invoice?.clientSnapshot || invoice.status === "draft")
    return new Response("Not found", { status: 404 })

  const pdf = await renderInvoicePdf(invoice)
  const filename = invoicePdfFilename(invoice)
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  })
}
