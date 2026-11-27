import type { Metadata } from "next"
import Link from "next/link"
import { requirePermission } from "@/features/auth/server/session"
import type {
  CatalogCategory,
  PricedCatalogItem,
} from "@/features/billing/application/engine-ports"
import {
  CatalogItemFields,
  CategoryFields,
} from "@/features/billing/components/service-fields"
import {
  catalogPriceLabel,
  groupByCategory,
} from "@/features/billing/domain/catalog"
import { formatMoney } from "@/features/billing/domain/format"
import { billingEngine } from "@/features/billing/server/billing"
import {
  deleteCategoryAction,
  saveCatalogItemAction,
  saveCategoryAction,
  setCatalogItemArchivedAction,
} from "@/features/billing/server/engine-actions"

import { ActionButton, ActionForm } from "@/components/ui/action-controls"
import { EmptyState } from "@/components/ui/empty-state"
import { PortalSection } from "@/components/portal/portal-section"
import { PortalPageHeader } from "@/components/portal/portal-shell"

export const metadata: Metadata = { title: "Services" }

const summaryClass =
  "inline-flex min-h-11 cursor-pointer items-center text-sm text-muted-foreground hover:text-foreground"

function ServiceRow({
  item,
  categories,
}: {
  item: PricedCatalogItem
  categories: readonly CatalogCategory[]
}) {
  return (
    <li className="grid gap-3 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <p className="font-medium">{item.name}</p>
          {item.description ? (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          ) : null}
        </div>
        <p className={item.price ? "tabular-nums" : "text-sm text-destructive"}>
          {catalogPriceLabel(item)}
        </p>
      </div>
      <details className="group">
        <summary className={summaryClass}>Edit</summary>
        <div className="grid max-w-2xl gap-4 pt-4">
          <ActionForm
            action={saveCatalogItemAction.bind(null, item.id)}
            submitLabel="Save service"
            resetOnSuccess={false}
          >
            <CatalogItemFields item={item} categories={categories} />
          </ActionForm>
          <div>
            <ActionButton
              action={setCatalogItemArchivedAction.bind(null, item.id, true)}
              variant="ghost"
            >
              Archive service
            </ActionButton>
          </div>
        </div>
      </details>
    </li>
  )
}

export default async function CatalogPage() {
  await requirePermission("billing:read")
  const [{ items, categories }, settings] = await Promise.all([
    billingEngine.pricedCatalog({ includeArchived: true }),
    billingEngine.getSettings(),
  ])
  const active = items.filter((item) => !item.archived)
  const archived = items.filter((item) => item.archived)
  const groups = groupByCategory(active, categories)
  const countIn = (categoryId: string) =>
    items.filter((item) => item.categoryId === categoryId).length

  return (
    <>
      <PortalPageHeader
        title="Services"
        description="Your price list. Add a service to a client or an invoice in one click; the price is copied, so changes here never alter existing clients or invoices."
      />
      <div className="stack-sections">
        <PortalSection
          title="Catalog"
          description={
            settings.defaultHourlyRate
              ? `Hourly services without their own or a category rate use the default of ${formatMoney(settings.defaultHourlyRate.amount, settings.defaultHourlyRate.currency)} / hour.`
              : undefined
          }
        >
          {groups.length === 0 ? (
            <EmptyState>No services yet. Add your first one below.</EmptyState>
          ) : (
            <div className="grid gap-8">
              {groups.map((group) => (
                <section
                  key={group.categoryId ?? "none"}
                  aria-label={group.name}
                >
                  <h3 className="text-meta">{group.name}</h3>
                  <ul className="rule-list">
                    {group.items.map((item) => (
                      <ServiceRow
                        key={item.id}
                        item={item}
                        categories={categories}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
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
            <CatalogItemFields categories={categories} />
          </ActionForm>
        </PortalSection>

        <PortalSection
          title="Categories"
          description={
            <>
              Group services and set an hourly rate shared by a category&apos;s
              hourly services. The global default rate is in{" "}
              <Link
                href="/admin/billing/settings"
                className="underline underline-offset-4"
              >
                Billing settings
              </Link>
              .
            </>
          }
        >
          {categories.length > 0 ? (
            <ul className="rule-list">
              {categories.map((category) => (
                <li key={category.id} className="grid gap-3 py-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="font-medium">
                      {category.name}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        · {countIn(category.id)} services
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {category.hourlyRate
                        ? `${formatMoney(category.hourlyRate.amount, category.hourlyRate.currency)} / hour`
                        : "No hourly rate"}
                    </p>
                  </div>
                  <details>
                    <summary className={summaryClass}>Edit</summary>
                    <div className="grid max-w-2xl gap-4 pt-4">
                      <ActionForm
                        action={saveCategoryAction.bind(null, category.id)}
                        submitLabel="Save category"
                        resetOnSuccess={false}
                      >
                        <CategoryFields category={category} />
                      </ActionForm>
                      <div>
                        <ActionButton
                          action={deleteCategoryAction.bind(null, category.id)}
                          variant="ghost"
                          confirm={`Delete ${category.name}? Its services stay in the catalog, uncategorized.`}
                        >
                          Delete category
                        </ActionButton>
                      </div>
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 grid max-w-2xl gap-4">
            <h3 className="font-medium">Add a category</h3>
            <ActionForm
              action={saveCategoryAction.bind(null, null)}
              submitLabel="Add category"
            >
              <CategoryFields />
            </ActionForm>
          </div>
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
