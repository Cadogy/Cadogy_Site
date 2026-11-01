import { requireAdmin } from "@/lib/auth/session"
import { PortalShell } from "@/components/portal/portal-shell"

const nav = [
  { label: "Overview", href: "/admin", exact: true },
  { label: "Invoices", href: "/admin/billing/invoices" },
  { label: "Clients", href: "/admin/billing/clients" },
  { label: "Services", href: "/admin/billing/catalog" },
  { label: "Billing settings", href: "/admin/billing/settings" },
  { label: "Inquiries", href: "/admin/inquiries" },
  { label: "Tickets", href: "/admin/tickets" },
  { label: "Users", href: "/admin/users" },
] as const

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAdmin()
  return (
    <PortalShell area="Admin" nav={nav} user={user}>
      {children}
    </PortalShell>
  )
}
