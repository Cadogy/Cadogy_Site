import type { Metadata } from "next"
import {
  ChangeEmailForm,
  DeleteAccount,
} from "@/features/account/components/account-lifecycle"
import { ProfileForm } from "@/features/account/components/settings-forms"
import { deletionEligibility } from "@/features/account/server/security"
import { requestAccountDeletionAction } from "@/features/account/server/security-actions"
import { requireSession } from "@/features/auth/server/session"

import { PortalSection } from "@/components/portal/portal-section"

export const metadata: Metadata = { title: "Account" }

export default async function AccountProfilePage() {
  const user = await requireSession("/account")
  const deletion = await deletionEligibility(user)

  return (
    <div className="stack-sections">
      <PortalSection
        layout="split"
        title="Profile"
        description="Your name appears on support requests and in emails from us."
      >
        <ProfileForm name={user.name} email={user.email} />
      </PortalSection>

      <PortalSection
        layout="split"
        title="Change email"
        description="We confirm with your current address first, then verify the new one."
      >
        <ChangeEmailForm currentEmail={user.email} />
      </PortalSection>

      <PortalSection
        layout="split"
        title="Delete account"
        description="Removes your login and signs you out everywhere. Paid invoices stay on record."
      >
        <DeleteAccount
          allowed={deletion.ok}
          reason={deletion.ok ? undefined : deletion.error}
          onRequest={requestAccountDeletionAction}
        />
      </PortalSection>
    </div>
  )
}
