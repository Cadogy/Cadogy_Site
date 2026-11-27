"use client"

import { createContext, useContext, useId, useState } from "react"

export type ServiceChoiceGroup = {
  readonly name: string
  readonly items: readonly {
    readonly id: string
    readonly name: string
    readonly priceLabel: string
  }[]
}

const ServiceChoices = createContext<readonly ServiceChoiceGroup[]>([])

/**
 * Sends the catalog to the page once, so every service's edit form can offer
 * it as package contents without repeating the list per form.
 */
export function ServiceChoicesProvider({
  groups,
  children,
}: {
  groups: readonly ServiceChoiceGroup[]
  children: React.ReactNode
}) {
  return (
    <ServiceChoices.Provider value={groups}>{children}</ServiceChoices.Provider>
  )
}

const matches = (name: string, query: string) =>
  name.toLowerCase().includes(query.trim().toLowerCase())

/**
 * Checkboxes for the services a package includes. They only render once
 * opened; until then the current choice is submitted as hidden fields, so
 * saving a closed form keeps the package as it was.
 */
export function IncludedServicesPicker({
  selected,
  excludeId,
}: {
  selected: readonly string[]
  excludeId?: string
}) {
  const groups = useContext(ServiceChoices)
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () => new Set(selected)
  )
  const [query, setQuery] = useState("")
  const searchId = useId()

  const available = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.id !== excludeId),
    }))
    .filter((group) => group.items.length > 0)
  const names = available
    .flatMap((group) => group.items)
    .filter((item) => chosen.has(item.id))
    .map((item) => item.name)

  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <details
      className="sm:col-span-2"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm">
        <span className="font-medium">Included services</span>
        <span className="truncate text-muted-foreground">
          {names.length === 0
            ? "None, so this isn't a package"
            : `${names.length}: ${names.slice(0, 3).join(", ")}${names.length > 3 ? "…" : ""}`}
        </span>
      </summary>
      {open ? (
        <div className="grid gap-3 pt-3">
          <label htmlFor={searchId} className="sr-only">
            Filter services
          </label>
          <input
            id={searchId}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter services"
            className="h-11 rounded-field border bg-background px-3 text-sm"
          />
          <div className="grid max-h-96 gap-5 overflow-y-auto rounded-field border p-3">
            {available.map((group) => {
              const visible = group.items.some((item) =>
                matches(item.name, query)
              )
              return (
                <fieldset
                  key={group.name}
                  className={visible ? "grid gap-1" : "hidden"}
                >
                  <legend className="mb-1 text-meta">{group.name}</legend>
                  {group.items.map((item) => (
                    // Filtered-out rows are hidden, not removed, so a ticked
                    // service is still submitted.
                    <label
                      key={item.id}
                      className={
                        matches(item.name, query)
                          ? "flex min-h-10 cursor-pointer items-center gap-3 text-sm"
                          : "hidden"
                      }
                    >
                      <input
                        type="checkbox"
                        name="includedItemIds"
                        value={item.id}
                        checked={chosen.has(item.id)}
                        onChange={() => toggle(item.id)}
                        className="size-5 shrink-0 accent-foreground"
                      />
                      <span className="flex-1">{item.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {item.priceLabel}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )
            })}
          </div>
        </div>
      ) : (
        [...chosen].map((id) => (
          <input key={id} type="hidden" name="includedItemIds" value={id} />
        ))
      )}
    </details>
  )
}
