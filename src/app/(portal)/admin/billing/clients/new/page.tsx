import type { Metadata } from "next"
import { requirePermission } from "@/features/auth/server/session"
import { ClientForm } from "@/features/billing/components/client-form"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Add client" }

export default async function NewClientPage() {
  await requirePermission("billing:read")
  return (
    <>
      <PortalPageHeader
        back={{ href: "/admin/billing/clients", label: "Clients" }}
        title="Add client"
        description="Billing details used on every invoice."
      />
      <div className="max-w-2xl border-t pt-8">
        <ClientForm client={null} />
      </div>
    </>
  )
}
