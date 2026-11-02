import type { Metadata } from "next"
import { ClientForm } from "@/features/billing/components/client-form"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Add client" }

export default function NewClientPage() {
  return (
    <>
      <PortalPageHeader
        title="Add client"
        description="Billing details used on every invoice."
      />
      <div className="max-w-2xl border-t pt-8">
        <ClientForm client={null} />
      </div>
    </>
  )
}
