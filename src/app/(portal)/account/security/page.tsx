import type { Metadata } from "next"
import { SessionList } from "@/features/account/components/session-list"
import { ChangePasswordForm } from "@/features/account/components/settings-forms"
import { myActivity, mySessions } from "@/features/account/server/security"
import {
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/features/account/server/security-actions"
import { requireSession } from "@/features/auth/server/session"

export const metadata: Metadata = { title: "Security" }

export default async function AccountSecurityPage() {
  const user = await requireSession("/account/security")
  const [sessions, activity] = await Promise.all([
    mySessions(),
    myActivity(user.id),
  ])

  return (
    <div className="grid gap-14">
      <section aria-labelledby="password-title" className="grid gap-6">
        <div>
          <h2 id="password-title" className="text-h3">
            Password
          </h2>
          <p className="mt-1 text-meta">
            Choose one you don&apos;t use anywhere else.
          </p>
        </div>
        <ChangePasswordForm />
      </section>

      <section aria-labelledby="sessions-title" className="grid gap-6">
        <div>
          <h2 id="sessions-title" className="text-h3">
            Where you&apos;re signed in
          </h2>
          <p className="mt-1 text-meta">
            Sign out any device you don&apos;t recognize, then change your
            password.
          </p>
        </div>
        <SessionList
          sessions={sessions}
          onRevoke={revokeSessionAction}
          onRevokeOthers={revokeOtherSessionsAction}
        />
      </section>

      <section aria-labelledby="activity-title" className="grid gap-6">
        <div>
          <h2 id="activity-title" className="text-h3">
            Recent activity
          </h2>
          <p className="mt-1 text-meta">
            Sign-ins and security changes on your account.
          </p>
        </div>
        {activity.length === 0 ? (
          <p className="border-t pt-4 text-muted-foreground">
            No activity yet.
          </p>
        ) : (
          <ul className="divide-y border-y">
            {activity.map((event) => (
              <li
                key={event.key}
                className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-3"
              >
                <span className={event.warning ? "text-warning" : undefined}>
                  {event.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {event.device}
                  {event.ip ? ` · ${event.ip}` : ""} · {event.when}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
