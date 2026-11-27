import { Suspense } from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import type { SessionUser } from "@/features/auth/application/guards"
import { canLoadStaffData } from "@/features/auth/domain/assurance"
import { can, isStaff } from "@/features/auth/domain/permissions"
import { requireSession } from "@/features/auth/server/session"
import { countInquiries } from "@/features/contact/server/admin"
import { support } from "@/features/support/server/support"
import { stopImpersonatingAction } from "@/features/users/actions"

import {
  portalNavigation,
  SIDEBAR_COOKIE,
} from "@/components/portal/navigation"
import { PortalShell } from "@/components/portal/portal-shell"

export const metadata: Metadata = { robots: { index: false, follow: false } }

const waitingCounts = async ({ role, ...session }: SessionUser) => {
  // Staff who still need two-factor are on their way to /account/security,
  // which this layout also renders; loading staff data here would redirect
  // them back to it in a loop.
  if (!isStaff(role) || !canLoadStaffData(session)) return {}
  // Count queries: every portal page shows these badges, so never load the
  // inquiries or tickets themselves here.
  const [inquiries, tickets] = await Promise.all([
    can(role, "inquiries:read") ? countInquiries("new") : 0,
    can(role, "support:read") ? support.countAwaitingStaff() : 0,
  ])
  return { inquiries, tickets }
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<PortalPending />}>
      <PortalFrame>{children}</PortalFrame>
    </Suspense>
  )
}

function PortalPending() {
  return (
    <div aria-busy="true" className="min-h-dvh">
      <span className="sr-only">Loading your portal</span>
    </div>
  )
}

async function PortalFrame({ children }: { children: React.ReactNode }) {
  const user = await requireSession()
  const [sidebar, counts] = await Promise.all([
    cookies().then((store) => store.get(SIDEBAR_COOKIE)?.value),
    waitingCounts(user),
  ])
  return (
    <PortalShell
      groups={portalNavigation(user.role)}
      user={user}
      impersonating={Boolean(user.impersonatedBy)}
      onStopImpersonating={stopImpersonatingAction}
      sidebarCollapsed={sidebar === "collapsed"}
      counts={counts}
    >
      {children}
    </PortalShell>
  )
}
