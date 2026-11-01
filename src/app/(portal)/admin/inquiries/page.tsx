import type { Metadata } from "next"
import Link from "next/link"
import { formatDate } from "@/features/billing/domain/format"
import { InquiryStatusSelect } from "@/features/contact/components/inquiry-status-select"
import {
  BUDGETS,
  INQUIRY_STATUSES,
  labelFor,
  PROJECT_TYPES,
  TIMELINES,
  type InquiryStatus,
} from "@/features/contact/domain/schema"
import { listInquiries } from "@/features/contact/server/admin"
import { Mail } from "lucide-react"

import { cn } from "@/lib/utils"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Inquiries" }

type Props = { searchParams: Promise<{ status?: string }> }

const isStatus = (value: string | undefined): value is InquiryStatus =>
  INQUIRY_STATUSES.some((status) => status === value)

export default async function InquiriesPage({ searchParams }: Props) {
  const { status } = await searchParams
  const filter = isStatus(status) ? status : undefined
  const inquiries = await listInquiries(filter)

  return (
    <>
      <PortalPageHeader
        title="Inquiries"
        description="Project requests from the contact form."
      />
      <nav
        aria-label="Filter inquiries"
        className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1"
      >
        {[undefined, ...INQUIRY_STATUSES].map((value) => (
          <Link
            key={value ?? "active"}
            href={
              value ? `/admin/inquiries?status=${value}` : "/admin/inquiries"
            }
            aria-current={filter === value ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 text-sm font-medium capitalize",
              filter === value
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {value ?? "All active"}
          </Link>
        ))}
      </nav>
      {inquiries.length === 0 ? (
        <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          No inquiries here.
        </p>
      ) : (
        <ul className="grid gap-4">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="rounded-xl border bg-card p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">
                    {inquiry.name}
                    {inquiry.company ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {inquiry.company}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(inquiry.createdAt)} ·{" "}
                    {labelFor(PROJECT_TYPES, inquiry.projectType)}
                    {inquiry.budget
                      ? ` · ${labelFor(BUDGETS, inquiry.budget)}`
                      : ""}
                    {inquiry.timeline
                      ? ` · ${labelFor(TIMELINES, inquiry.timeline)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`mailto:${inquiry.email}?subject=${encodeURIComponent("Re: your project inquiry")}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-accent"
                  >
                    <Mail className="size-4" aria-hidden="true" />
                    Reply
                  </a>
                  <InquiryStatusSelect
                    id={inquiry.id}
                    status={inquiry.status}
                  />
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-line">
                {inquiry.message}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {inquiry.email}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
