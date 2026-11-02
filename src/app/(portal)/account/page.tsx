import type { Metadata } from "next"
import {
  ChangeEmailForm,
  DeleteAccount,
} from "@/features/account/components/account-lifecycle"
import { ProfileForm } from "@/features/account/components/settings-forms"
import { deletionEligibility } from "@/features/account/server/security"
import { requestAccountDeletionAction } from "@/features/account/server/security-actions"
import { requireSession } from "@/features/auth/server/session"

export const metadata: Metadata = { title: "Account" }

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section aria-labelledby={id} className="grid gap-6">
      <div>
        <h2 id={id} className="text-h3">
          {title}
        </h2>
        <p className="mt-1 text-meta">{description}</p>
      </div>
      {children}
    </section>
  )
}

export default async function AccountProfilePage() {
  const user = await requireSession("/account")
  const deletion = await deletionEligibility(user)

  return (
    <div className="grid gap-14">
      <Section
        id="profile-title"
        title="Profile"
        description="Your name appears on support requests and in emails from us."
      >
        <ProfileForm name={user.name} email={user.email} />
      </Section>

      <Section
        id="email-title"
        title="Change email"
        description="We confirm with your current address first, then verify the new one."
      >
        <ChangeEmailForm currentEmail={user.email} />
      </Section>

      <Section
        id="delete-title"
        title="Delete account"
        description="Removes your login and signs you out everywhere. Paid invoices stay on record."
      >
        <DeleteAccount
          allowed={deletion.ok}
          reason={deletion.ok ? undefined : deletion.error}
          onRequest={requestAccountDeletionAction}
        />
      </Section>
    </div>
  )
}
