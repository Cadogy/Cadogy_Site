import type { Metadata } from "next"
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

import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { FilterTabs } from "@/components/portal/portal-section"
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
      <FilterTabs
        label="Filter inquiries"
        items={[undefined, ...INQUIRY_STATUSES].map((value) => ({
          label: value ? value[0].toUpperCase() + value.slice(1) : "All active",
          href: value ? `/admin/inquiries?status=${value}` : "/admin/inquiries",
          active: filter === value,
        }))}
      />
      {inquiries.length === 0 ? (
        <EmptyState>No inquiries here.</EmptyState>
      ) : (
        <ul className="rule-list">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="py-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium">
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
                  <Button asChild variant="outline">
                    <a
                      href={`mailto:${inquiry.email}?subject=${encodeURIComponent("Re: your project inquiry")}`}
                    >
                      <Mail className="size-4" aria-hidden="true" />
                      Reply
                    </a>
                  </Button>
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
