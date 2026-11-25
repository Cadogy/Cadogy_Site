import { SignalGrid } from "@/components/media/signal-grid"

const FROM_TOP_RIGHT = [1, 0] as const

export function PortalHero({
  title,
  meta,
  description,
  actions,
  children,
}: {
  title: string
  meta?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="relative isolate -mx-4 -mt-8 mb-12 overflow-hidden px-4 pt-10 pb-2 sm:-mx-6 sm:px-6 lg:-mx-10 lg:-mt-12 lg:px-10 lg:pt-14">
      <SignalGrid
        origin={FROM_TOP_RIGHT}
        peak={0.26}
        base={0.012}
        className="-z-10 [mask-image:linear-gradient(to_bottom,black,transparent_85%),linear-gradient(to_left,black_10%,transparent_75%)] [mask-composite:intersect] opacity-80"
      />
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-2">
          {meta ? (
            <p className="text-sm text-muted-foreground">{meta}</p>
          ) : null}
          <h1 className="text-title">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>
      {children ? <div className="mt-10">{children}</div> : null}
    </header>
  )
}
