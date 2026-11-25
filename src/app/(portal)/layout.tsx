import { Suspense } from "react"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { can, isStaff, type Role } from "@/features/auth/domain/permissions"
import { requireSession } from "@/features/auth/server/session"
import { listInquiries } from "@/features/contact/server/admin"
import { needsStaffReply } from "@/features/support/application/support-service"
import { support } from "@/features/support/server/support"
import { stopImpersonatingAction } from "@/features/users/actions"

import {
  portalNavigation,
  SIDEBAR_COOKIE,
} from "@/components/portal/navigation"
import { PortalShell } from "@/components/portal/portal-shell"

export const metadata: Metadata = { robots: { index: false, follow: false } }

const waitingCounts = async (role: Role) => {
  if (!isStaff(role)) return {}
  const [inquiries, tickets] = await Promise.all([
    can(role, "inquiries:read") ? listInquiries("new") : [],
    can(role, "support:read") ? support.listAll() : [],
  ])
  return {
    inquiries: inquiries.length,
    tickets: tickets.filter(needsStaffReply).length,
  }
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
    waitingCounts(user.role),
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
