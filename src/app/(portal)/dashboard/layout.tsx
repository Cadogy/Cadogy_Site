import { requireUser } from "@/lib/auth/session"
import { PortalShell } from "@/components/portal/portal-shell"

const nav = [
  { label: "Overview", href: "/dashboard", exact: true },
  { label: "Billing", href: "/dashboard/billing" },
  { label: "Support", href: "/dashboard/tickets" },
  { label: "Settings", href: "/dashboard/settings" },
] as const

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  return (
    <PortalShell area="Client" nav={nav} user={user}>
      {children}
    </PortalShell>
  )
}
