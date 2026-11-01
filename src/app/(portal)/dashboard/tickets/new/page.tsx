import type { Metadata } from "next"
import { NewTicketForm } from "@/features/support/components/ticket-forms"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "New support request" }

export default function NewTicketPage() {
  return (
    <div className="max-w-2xl">
      <PortalPageHeader
        title="New support request"
        description="We will reply here and email you when we do."
      />
      <NewTicketForm />
    </div>
  )
}
