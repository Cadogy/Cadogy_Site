import type { Metadata } from "next"
import Link from "next/link"
import {
  activeLockouts,
  staffSecurity,
  studioLog,
} from "@/features/auth/server/security-overview"
import { requirePermission } from "@/features/auth/server/session"

import { cn } from "@/lib/utils"
import { PortalSection } from "@/components/portal/portal-section"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Security" }

const FILTERS = [
  { label: "All", value: "" },
  { label: "Sign-ins", value: "sign_ins" },
  { label: "Failures", value: "failures" },
  { label: "Studio actions", value: "studio" },
  { label: "Account changes", value: "account" },
] as const

type Props = { searchParams: Promise<{ group?: string }> }

export default async function SecurityPage({ searchParams }: Props) {
  await requirePermission("security:read", "/admin/security")
  const { group = "" } = await searchParams
  const [staff, lockouts, log] = await Promise.all([
    staffSecurity(),
    activeLockouts(),
    studioLog(group || undefined),
  ])

  return (
    <>
      <PortalPageHeader
        title="Security"
        description="Staff sign-in strength, active lockouts and everything that happened, newest first."
      />
      <div className="stack-sections">
        <PortalSection
          title="Staff accounts"
          description="Every owner and admin needs two-factor or a passkey to open the studio."
        >
          <ul className="rule-list">
            {staff.map((member) => {
              const protectedAccount = member.twoFactor || member.passkeys > 0
              return (
                <li
                  key={member.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                >
                  <span>
                    <span className="font-medium">
                      {member.name || member.email}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {member.role} · {member.email}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      protectedAccount
                        ? "text-muted-foreground"
                        : "text-warning"
                    )}
                  >
                    {member.twoFactor ? "Two-factor on" : "No two-factor"} ·{" "}
                    {member.passkeys === 1
                      ? "1 passkey"
                      : `${member.passkeys} passkeys`}
                  </span>
                </li>
              )
            })}
          </ul>
        </PortalSection>

        <PortalSection
          title="Active lockouts"
          description="Emails with password sign-in paused after 10 failed attempts in 15 minutes."
        >
          {lockouts.length === 0 ? (
            <p className="border-t pt-4 text-muted-foreground">
              No lockouts right now.
            </p>
          ) : (
            <ul className="rule-list">
              {lockouts.map((lock) => (
                <li
                  key={lock._id}
                  className="flex flex-wrap justify-between gap-x-4 py-3"
                >
                  <span className="text-warning">{lock._id}</span>
                  <span className="text-sm text-muted-foreground">
                    {lock.count} failed attempts
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PortalSection>

        <PortalSection
          title="Security log"
          description="The last 200 events. Kept for a year."
        >
          <nav
            aria-label="Filter the security log"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((filter) => (
              <Link
                key={filter.value}
                href={
                  filter.value
                    ? `/admin/security?group=${filter.value}`
                    : "/admin/security"
                }
                aria-current={group === filter.value ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
                  group === filter.value
                    ? "border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter.label}
              </Link>
            ))}
          </nav>
          {log.length === 0 ? (
            <p className="border-t pt-4 text-muted-foreground">
              Nothing logged yet.
            </p>
          ) : (
            <ul className="rule-list">
              {log.map((event) => (
                <li key={event.key} className="grid gap-1 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <span
                      className={event.warning ? "text-warning" : undefined}
                    >
                      {event.label}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {event.when}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[
                      event.target ? `Account: ${event.target}` : null,
                      event.actor && event.actor !== event.target
                        ? `By: ${event.actor}`
                        : null,
                      event.detail || null,
                      event.device,
                      event.ip || null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </PortalSection>
      </div>
    </>
  )
}
