import type { Metadata } from "next"
import { ProfileForm } from "@/features/account/components/settings-forms"
import { requireSession } from "@/features/auth/server/session"

export const metadata: Metadata = { title: "Account" }

export default async function AccountProfilePage() {
  const user = await requireSession("/account")
  return (
    <section aria-labelledby="profile-title" className="grid gap-6">
      <div>
        <h2 id="profile-title" className="text-h3">
          Profile
        </h2>
        <p className="mt-1 text-meta">
          Your name appears on support requests and in emails from us.
        </p>
      </div>
      <ProfileForm name={user.name} email={user.email} />
    </section>
  )
}
