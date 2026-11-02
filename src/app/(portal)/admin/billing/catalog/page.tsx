import type { Metadata } from "next"
import {
  ActionButton,
  ActionForm,
} from "@/features/billing/components/action-controls"
import { CatalogItemFields } from "@/features/billing/components/service-fields"
import { formatMoney, intervalLabel } from "@/features/billing/domain/format"
import { billingEngine } from "@/features/billing/server/billing"
import {
  saveCatalogItemAction,
  setCatalogItemArchivedAction,
} from "@/features/billing/server/engine-actions"

import { EmptyState } from "@/components/ui/empty-state"
import { PortalSection } from "@/components/portal/portal-section"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Services" }

export default async function CatalogPage() {
  const items = await billingEngine.listCatalog({ includeArchived: true })
  const active = items.filter((item) => !item.archived)
  const archived = items.filter((item) => item.archived)

  return (
    <>
      <PortalPageHeader
        title="Services"
        description="Your price list. Add a service to any client in one click; the price is copied, so changes here never alter existing clients."
      />
      <div className="stack-sections">
        <PortalSection title="Catalog">
          {active.length === 0 ? (
            <EmptyState>No services yet. Add your first one below.</EmptyState>
          ) : (
            <ul className="rule-list">
              {active.map((item) => (
                <li key={item.id} className="grid gap-3 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description ? (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <p className="tabular-nums">
                      {formatMoney(item.unitAmount, item.currency)}{" "}
                      <span className="text-muted-foreground">
                        {intervalLabel(item.interval, "per")}
                      </span>
                    </p>
                  </div>
                  <details className="group">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground">
                      Edit
                    </summary>
                    <div className="grid max-w-2xl gap-4 pt-4">
                      <ActionForm
                        action={saveCatalogItemAction.bind(null, item.id)}
                        submitLabel="Save service"
                        resetOnSuccess={false}
                      >
                        <CatalogItemFields item={item} />
                      </ActionForm>
                      <div>
                        <ActionButton
                          action={setCatalogItemArchivedAction.bind(
                            null,
                            item.id,
                            true
                          )}
                          variant="ghost"
                        >
                          Archive service
                        </ActionButton>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </PortalSection>

        <PortalSection
          title="Add a service"
          description="Clients keep the price they signed up at, even if you change it here later."
          layout="split"
        >
          <ActionForm
            action={saveCatalogItemAction.bind(null, null)}
            submitLabel="Add service"
          >
            <CatalogItemFields />
          </ActionForm>
        </PortalSection>

        {archived.length > 0 ? (
          <PortalSection title="Archived">
            <ul className="rule-list">
              {archived.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <span className="text-muted-foreground">{item.name}</span>
                  <ActionButton
                    action={setCatalogItemArchivedAction.bind(
                      null,
                      item.id,
                      false
                    )}
                    variant="ghost"
                  >
                    Restore
                  </ActionButton>
                </li>
              ))}
            </ul>
          </PortalSection>
        ) : null}
      </div>
    </>
  )
}
