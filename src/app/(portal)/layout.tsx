import type { Metadata } from "next"
import { requireSession } from "@/features/auth/server/session"

import { portalNavigation } from "@/components/portal/navigation"
import { PortalShell } from "@/components/portal/portal-shell"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireSession()
  return (
    <PortalShell groups={portalNavigation(user.role)} user={user}>
      {children}
    </PortalShell>
  )
}
