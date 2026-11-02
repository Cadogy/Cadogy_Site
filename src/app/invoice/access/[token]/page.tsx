import type { Metadata } from "next"
import { AccessDecision } from "@/features/billing/components/access-decision"
import { accessRequests } from "@/features/billing/server/access"
import { decideInvoiceAccessAction } from "@/features/billing/server/team-actions"

import { Logo } from "@/components/site/logo"

export const metadata: Metadata = {
  title: "Review access request",
  robots: { index: false, follow: false, nocache: true },
}

type Props = { params: Promise<{ token: string }> }

export default async function AccessRequestPage({ params }: Props) {
  const { token } = await params
  const request = await accessRequests.preview(token)

  return (
    <div className="paper min-h-dvh">
      <header className="container-page flex h-16 items-center">
        <Logo />
      </header>
      <main id="main" className="container-page max-w-xl pt-10 pb-16">
        {request ? (
          <div className="grid gap-6">
            <h1 className="text-h2">Review access request</h1>
            <p className="text-lead">
              {request.name
                ? `${request.name} (${request.email})`
                : request.email}{" "}
              opened{" "}
              {request.invoiceNumber
                ? `invoice ${request.invoiceNumber}`
                : "an invoice"}{" "}
              and asked to see {request.company}&apos;s invoices on Cadogy.
            </p>
            <p className="border-l-2 pl-4 text-sm text-muted-foreground">
              Approving makes them a viewer: they can see invoices, statements
              and support requests, and pay invoices. They can&apos;t manage
              saved cards, autopay or your team. You can remove them any time
              from the Team page.
            </p>
            <AccessDecision
              onDecide={decideInvoiceAccessAction.bind(null, token)}
            />
          </div>
        ) : (
          <div className="grid gap-4">
            <h1 className="text-h2">This link has expired</h1>
            <p className="text-lead">
              Access requests expire after 7 days or once someone has answered
              them. If you still need to add someone, invite them from the Team
              page in your dashboard.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
