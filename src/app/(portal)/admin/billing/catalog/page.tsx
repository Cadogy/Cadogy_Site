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
      <div className="grid gap-12">
        <section aria-labelledby="catalog-list">
          <h2 id="catalog-list" className="mb-4 font-semibold">
            Catalog
          </h2>
          {active.length === 0 ? (
            <p className="border-t py-6 text-muted-foreground">
              No services yet. Add your first one below.
            </p>
          ) : (
            <ul className="divide-y border-y">
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
                    <div className="grid gap-4 pt-4">
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
        </section>

        <section aria-labelledby="catalog-new" className="border-t pt-8">
          <h2 id="catalog-new" className="mb-4 font-semibold">
            Add a service
          </h2>
          <ActionForm
            action={saveCatalogItemAction.bind(null, null)}
            submitLabel="Add service"
          >
            <CatalogItemFields />
          </ActionForm>
        </section>

        {archived.length > 0 ? (
          <section aria-labelledby="catalog-archived" className="border-t pt-8">
            <h2 id="catalog-archived" className="mb-4 font-semibold">
              Archived
            </h2>
            <ul className="divide-y border-y">
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
          </section>
        ) : null}
      </div>
    </>
  )
}
