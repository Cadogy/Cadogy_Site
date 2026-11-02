import type { Metadata } from "next"
import { cookies } from "next/headers"
import { requireSession } from "@/features/auth/server/session"
import { stopImpersonatingAction } from "@/features/users/actions"

import {
  portalNavigation,
  SIDEBAR_COOKIE,
} from "@/components/portal/navigation"
import { PortalShell } from "@/components/portal/portal-shell"

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireSession()
  const sidebar = (await cookies()).get(SIDEBAR_COOKIE)?.value
  return (
    <PortalShell
      groups={portalNavigation(user.role)}
      user={user}
      impersonating={Boolean(user.impersonatedBy)}
      onStopImpersonating={stopImpersonatingAction}
      sidebarCollapsed={sidebar === "collapsed"}
    >
      {children}
    </PortalShell>
  )
}
