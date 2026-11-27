import type { Metadata } from "next"
import Link from "next/link"
import { requireSession } from "@/features/auth/server/session"
import { TICKET_CATEGORIES } from "@/features/support/application/support-service"
import { CATEGORY_GUIDE } from "@/features/support/components/ticket-categories"
import { TicketList } from "@/features/support/components/ticket-list"
import { support } from "@/features/support/server/support"

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
      {tickets.length === 0 ? (
        <section aria-labelledby="start-request" className="border-t pt-8">
          <h2 id="start-request" className="text-lg font-medium">
            No requests yet. What can we help with?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a topic to start. You can change it on the next screen.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {TICKET_CATEGORIES.map((category) => {
              const { icon: Icon, blurb } = CATEGORY_GUIDE[category.value]
              return (
                <li key={category.value}>
                  <Link
                    href={`/dashboard/tickets/new?category=${category.value}`}
                    className="flex min-h-11 items-start gap-3 rounded-field border p-4 transition-colors hover:border-foreground/40 hover:bg-foreground/[0.03]"
                  >
                    <Icon
                      className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="grid gap-0.5">
                      <span className="font-medium">{category.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {blurb}
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <TicketList
          tickets={tickets}
          basePath="/dashboard/tickets"
          viewer="client"
          emptyMessage="You have no support requests yet."
        />
      )}
    </>
  )
}
