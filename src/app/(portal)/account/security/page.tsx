import type { Metadata } from "next"
import { FormAlert } from "@/features/account/components/auth-card"
import { PasskeySettings } from "@/features/account/components/passkey-settings"
import { SessionList } from "@/features/account/components/session-list"
import { ChangePasswordForm } from "@/features/account/components/settings-forms"
import { TwoFactorSettings } from "@/features/account/components/two-factor-settings"
import {
  myActivity,
  mySecondFactors,
  mySessions,
} from "@/features/account/server/security"
import {
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/features/account/server/security-actions"
import { requireSession } from "@/features/auth/server/session"

import { PortalSection } from "@/components/portal/portal-section"

export const metadata: Metadata = { title: "Security" }

type Props = { searchParams: Promise<{ required?: string }> }

export default async function AccountSecurityPage({ searchParams }: Props) {
  const user = await requireSession("/account/security")
  const { required } = await searchParams
  const [factors, sessions, activity] = await Promise.all([
    mySecondFactors(),
    mySessions(),
    myActivity(user.id),
  ])
  const needsSecondFactor =
    required === "two-factor" &&
    !factors.twoFactorEnabled &&
    factors.passkeys.length === 0

  return (
    <div className="stack-sections">
      {needsSecondFactor ? (
        <FormAlert>
          Your role needs two-factor authentication. Turn on an authenticator
          app or add a passkey below, then open the studio again.
        </FormAlert>
      ) : null}

      <PortalSection
        layout="split"
        title="Two-factor authentication"
        description="A code from your phone, on top of your password."
      >
        <TwoFactorSettings enabled={factors.twoFactorEnabled} />
      </PortalSection>

      <PortalSection
        layout="split"
        title="Passkeys"
        description="Sign in with your fingerprint, face or device PIN. Nothing to type, nothing to phish."
      >
        <PasskeySettings passkeys={factors.passkeys} />
      </PortalSection>

      <PortalSection
        layout="split"
        title="Password"
        description="Choose one you don't use anywhere else."
      >
        <ChangePasswordForm />
      </PortalSection>

      <PortalSection
        layout="split"
        title="Where you're signed in"
        description="Sign out any device you don't recognize, then change your password."
      >
        <SessionList
          sessions={sessions}
          onRevoke={revokeSessionAction}
          onRevokeOthers={revokeOtherSessionsAction}
        />
      </PortalSection>

      <PortalSection
        layout="split"
        title="Recent activity"
        description="Sign-ins and security changes on your account."
      >
        {activity.length === 0 ? (
          <p className="border-t pt-4 text-muted-foreground">
            No activity yet.
          </p>
        ) : (
          <ul className="rule-list">
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
      </PortalSection>
    </div>
  )
}
