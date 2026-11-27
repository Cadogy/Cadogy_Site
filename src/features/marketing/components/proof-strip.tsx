import Link from "next/link"

import { cn } from "@/lib/utils"

import { studioFigures } from "../content"

function FigureList({ copy = false }: { copy?: boolean }) {
  return (
    <ul
      aria-hidden={copy || undefined}
      className={cn(
        "flex shrink-0 items-center gap-8 pr-8 xl:gap-10 xl:pr-0",
        copy && "xl:hidden"
      )}
    >
      {studioFigures.map((figure) => (
        <li key={figure.label}>
          <Link
            href="/who-we-are#proof"
            tabIndex={copy ? -1 : undefined}
            className="inline-flex min-h-11 items-center gap-2 text-sm whitespace-nowrap"
          >
            <span className="chip-brand px-1.5 py-0.5 font-medium tabular-nums">
              {figure.value}
            </span>
            <span className="text-muted-foreground">{figure.short}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ProofStrip() {
  return (
    <section
      aria-label="Track record"
      className="overflow-x-clip border-t bg-background"
    >
      <div className="container-page py-2 xl:grid xl:grid-cols-12 xl:items-center xl:gap-x-10 xl:py-5">
        <p className="hidden text-sm text-muted-foreground xl:col-span-3 xl:block">
          The track record
        </p>
        <div className="-mx-5 min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto md:-mx-8 xl:col-span-9 xl:col-start-4 xl:mx-0 xl:flex xl:justify-end xl:overflow-visible xl:[mask-image:none]">
          <div className="flex w-max animate-[ticker_32s_linear_infinite] hover:[animation-play-state:paused] xl:w-auto xl:animate-none">
            <FigureList />
            <FigureList copy />
          </div>
        </div>
      </div>
    </section>
  )
}
