import type { Metadata } from "next"
import { requireSession } from "@/features/auth/server/session"
import { ContactsManager } from "@/features/billing/components/contacts-manager"
import { contactRoleFor } from "@/features/billing/domain/contacts"
import { billing } from "@/features/billing/server/billing"
import {
  inviteTeamContactAction,
  removeTeamContactAction,
  setTeamContactRoleAction,
} from "@/features/billing/server/team-actions"

import { EmptyState } from "@/components/ui/empty-state"
import { PortalSection } from "@/components/portal/portal-section"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Team" }

export default async function TeamPage() {
  const user = await requireSession("/dashboard/team")
  const accounts = await billing.clientsForPortalUser(user.email)

  return (
    <>
      <PortalPageHeader
        title="Team"
        description="Who at your company can see invoices, pay them and manage billing."
      />
      {accounts.length === 0 ? (
        <EmptyState>
          You&apos;re not on a billing account yet. When we send you an invoice,
          or someone on your team invites you, it will appear here.
        </EmptyState>
      ) : (
        <div className="stack-sections">
          {accounts.map((account) => (
            <PortalSection
              key={account.id}
              title={account.company || account.name}
            >
              <ContactsManager
                primary={{ email: account.email, name: account.name }}
                contacts={account.contacts}
                canManage={
                  !user.impersonatedBy &&
                  contactRoleFor(account, user.email) === "billing"
                }
                onInvite={inviteTeamContactAction.bind(null, account.id)}
                onRoleChange={setTeamContactRoleAction.bind(null, account.id)}
                onRemove={removeTeamContactAction.bind(null, account.id)}
              />
            </PortalSection>
          ))}
        </div>
      )}
    </>
  )
}
