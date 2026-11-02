import type { Metadata } from "next"
import { requirePermission } from "@/features/auth/server/session"
import { CreditNoteList } from "@/features/billing/components/credit-note-list"
import { credits } from "@/features/billing/server/billing"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Credit notes" }

export default async function CreditNotesPage() {
  await requirePermission("billing:read")
  const notes = await credits.notesFor({})

  return (
    <>
      <PortalPageHeader
        title="Credit notes"
        description="Every refund and credit, numbered in order. Issue them from an invoice or a client."
      />
      <CreditNoteList
        notes={notes}
        hrefFor={(invoiceId) => `/admin/billing/invoices/${invoiceId}`}
      />
    </>
  )
}
