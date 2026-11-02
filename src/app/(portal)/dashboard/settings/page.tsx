import type { Metadata } from "next"
import {
  ChangePasswordForm,
  ProfileForm,
} from "@/features/account/components/settings-forms"

import { requireSession } from "@/features/auth/server/session"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  const user = await requireSession("/dashboard/settings")
  return (
    <>
      <PortalPageHeader
        title="Settings"
        description="Manage your profile and password."
      />
      <div className="grid max-w-2xl gap-6">
        <section
          aria-labelledby="profile-title"
          className="rounded-xl border bg-card p-5 sm:p-6"
        >
          <h2 id="profile-title" className="mb-5 font-semibold">
            Profile
          </h2>
          <ProfileForm name={user.name} email={user.email} />
        </section>
        <section
          aria-labelledby="password-title"
          className="rounded-xl border bg-card p-5 sm:p-6"
        >
          <h2 id="password-title" className="mb-5 font-semibold">
            Password
          </h2>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  )
}
