import type { Metadata } from "next"
import Link from "next/link"
import { requireSession } from "@/features/auth/server/session"
import { NewTicketFormLoader } from "@/features/support/components/new-ticket-form-loader"
import { support } from "@/features/support/server/support"
import { Mail, MessagesSquare, Send } from "lucide-react"

import { siteConfig } from "@/config/site"
import { formatDayUtc } from "@/lib/format-date"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "New support request" }

type Props = {
  searchParams: Promise<{ category?: string; subject?: string }>
}

const STEPS = [
  {
    icon: Send,
    title: "Send your request",
    body: "It goes straight to the team working on your project.",
  },
  {
    icon: Mail,
    title: "We email you when we reply",
    body: "Replies appear on the request and arrive in your inbox.",
  },
  {
    icon: MessagesSquare,
    title: "Keep it in one thread",
    body: "Reply on the request to add details or follow up.",
  },
] as const

export default async function NewTicketPage({ searchParams }: Props) {
  const user = await requireSession("/dashboard/tickets/new")
  const [{ category, subject }, tickets] = await Promise.all([
    searchParams,
    support.listForUser(user.id),
  ])
  const recent = tickets
    .filter((ticket) => ticket.status !== "closed")
    .slice(0, 3)

  return (
    <>
      <PortalPageHeader
        back={{ href: "/dashboard/tickets", label: "Support" }}
        title="New support request"
        description="Tell us what you need. We reply here and by email."
      />
      <div className="grid gap-12 border-t pt-8 lg:grid-cols-[minmax(0,1fr)_20rem] xl:gap-16">
        <NewTicketFormLoader
          initialCategory={category}
          initialSubject={subject}
        />

        <aside className="grid content-start gap-8 lg:sticky lg:top-6 lg:self-start">
          <section aria-labelledby="next-steps" className="grid gap-5 panel">
            <h2 id="next-steps" className="font-medium">
              What happens next
            </h2>
            <ol className="grid gap-5">
              {STEPS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/5">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">{title}</span>
                    <span className="text-sm text-muted-foreground">
                      {body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {recent.length > 0 ? (
            <section aria-labelledby="recent-requests" className="grid gap-3">
              <h2 id="recent-requests" className="text-sm font-medium">
                Already asked? Your open requests
              </h2>
              <ul className="rule-list text-sm">
                {recent.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      href={`/dashboard/tickets/${ticket.id}`}
                      className="-mx-2 grid min-h-11 gap-0.5 rounded-field px-2 py-2 transition-colors hover:bg-foreground/5"
                    >
                      <span className="truncate">{ticket.subject}</span>
                      <span className="text-muted-foreground">
                        Updated {formatDayUtc(ticket.lastReplyAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-sm text-muted-foreground">
            Prefer email? Write to{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-foreground underline underline-offset-4"
            >
              {siteConfig.email}
            </a>
            .
          </p>
        </aside>
      </div>
    </>
  )
}
