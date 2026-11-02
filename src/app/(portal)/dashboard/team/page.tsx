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
        <p className="border-t pt-6 text-muted-foreground">
          You&apos;re not on a billing account yet. When we send you an invoice,
          or someone on your team invites you, it will appear here.
        </p>
      ) : (
        <div className="grid gap-14">
          {accounts.map((account) => (
            <section
              key={account.id}
              aria-labelledby={`team-${account.id}`}
              className="grid gap-6"
            >
              <h2 id={`team-${account.id}`} className="text-h3">
                {account.company || account.name}
              </h2>
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
            </section>
          ))}
        </div>
      )}
    </>
  )
}
