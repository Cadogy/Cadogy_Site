import { AccountTabs } from "@/features/account/components/account-tabs"

import { PortalPageHeader } from "@/components/portal/portal-shell"

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-3xl">
      <PortalPageHeader
        title="Account"
        description="Your profile, sign-in and security."
      />
      <AccountTabs />
      {children}
    </div>
  )
}
