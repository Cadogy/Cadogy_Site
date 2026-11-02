import type { Metadata } from "next"
import Link from "next/link"
import { TicketList } from "@/features/support/components/ticket-list"
import { support } from "@/features/support/server/support"

import { requireSession } from "@/features/auth/server/session"
import { Button } from "@/components/ui/button"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Support" }

export default async function SupportPage() {
  const user = await requireSession("/dashboard/tickets")
  const tickets = await support.listForUser(user.id)
  return (
    <>
      <PortalPageHeader
        title="Support"
        description="Questions about a project or an invoice? We reply here and by email."
        actions={
          <Button asChild>
            <Link href="/dashboard/tickets/new">New request</Link>
          </Button>
        }
      />
      <TicketList
        tickets={tickets}
        basePath="/dashboard/tickets"
        viewer="client"
        emptyMessage="You have no support requests yet."
      />
    </>
  )
}
