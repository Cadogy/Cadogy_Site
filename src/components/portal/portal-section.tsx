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
          "mb-6 flex gap-4",
          split
            ? "flex-col"
            : "flex-row flex-wrap items-start justify-between gap-y-3",
          split && "lg:mb-0"
        )}
      >
        <div
          className={cn(
            "grid min-w-0 content-start gap-1",
            // The basis only makes sense side by side; in a split layout the
            // header is a column, where it would stretch the title block
            // 16rem tall and push the description away from the title.
            !split && "flex-[1_1_16rem]"
          )}
        >
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
  3: "@2xl:grid-cols-3",
  4: "@3xl:grid-cols-4",
}

export function StatList({
  stats,
  size = "default",
}: {
  size?: "default" | "large"
  stats: readonly {
    readonly label: string
    readonly value: React.ReactNode
    readonly detail?: React.ReactNode
  }[]
}) {
  return (
    <div className="@container border-t pt-6">
      <dl
        className={cn(
          "grid grid-cols-2 gap-x-8 gap-y-8",
          STAT_COLUMNS[Math.min(stats.length, 4)]
        )}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="grid min-w-0 content-start gap-1">
            <dt className="text-meta">{stat.label}</dt>
            <dd
              className={cn(
                "tabular-nums",
                size === "large" ? "text-h3 sm:text-h2" : "text-h3"
              )}
            >
              {stat.value}
            </dd>
            {stat.detail ? (
              <dd className="text-sm text-muted-foreground">{stat.detail}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </div>
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
    readonly count?: number
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
          className={cn(pillTabClass(item.active), "gap-2")}
        >
          {item.label}
          {item.count === undefined ? null : (
            <span
              className={cn(
                "text-xs tabular-nums",
                item.active ? "opacity-70" : "text-muted-foreground"
              )}
            >
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )
}
