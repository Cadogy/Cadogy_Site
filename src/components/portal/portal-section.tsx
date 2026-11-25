import { useId } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { pillTabClass } from "@/components/ui/pill-tab"

export function PortalSection({
  title,
  description,
  actions,
  layout = "stack",
  className,
  children,
}: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
  layout?: "stack" | "split"
  className?: string
  children: React.ReactNode
}) {
  const id = useId()
  const split = layout === "split"

  return (
    <section
      aria-labelledby={id}
      className={cn(
        "border-t pt-8",
        split && "lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12",
        className
      )}
    >
      <div
        className={cn(
          "mb-6 flex flex-col gap-4",
          !split && "sm:flex-row sm:items-start sm:justify-between",
          split && "lg:mb-0"
        )}
      >
        <div className="grid gap-1">
          <h2 id={id} className="text-lg font-medium">
            {title}
          </h2>
          {description ? (
            <div className="max-w-2xl text-sm text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
        ) : null}
      </div>
      <div
        className={cn(
          "min-w-0 [&>.rule-list:first-child]:border-t-0",
          split && "max-w-2xl"
        )}
      >
        {children}
      </div>
    </section>
  )
}

const STAT_COLUMNS: Record<number, string> = {
  1: "",
  2: "",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
}

export function StatList({
  stats,
}: {
  stats: readonly {
    readonly label: string
    readonly value: React.ReactNode
    readonly detail?: React.ReactNode
  }[]
}) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-8 gap-y-8 border-t pt-6",
        STAT_COLUMNS[Math.min(stats.length, 4)]
      )}
    >
      {stats.map((stat) => (
        <div key={stat.label} className="grid content-start gap-1">
          <dt className="text-meta">{stat.label}</dt>
          <dd className="text-h3 tabular-nums">{stat.value}</dd>
          {stat.detail ? (
            <dd className="text-sm text-muted-foreground">{stat.detail}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  )
}

export function FilterTabs({
  label,
  items,
}: {
  label: string
  items: readonly {
    readonly label: string
    readonly href: string
    readonly active: boolean
  }[]
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-1 mb-6 flex gap-1 overflow-x-auto px-1"
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={pillTabClass(item.active)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
