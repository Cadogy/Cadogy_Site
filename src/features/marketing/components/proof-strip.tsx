import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

import { caseStudies } from "../content"

const HEADLINE_FACT: Record<string, string> = {
  playerbay: "Automated test files",
  "opencode-sidecar": "Unit tests",
}

const items = caseStudies.flatMap((study) => {
  const fact = study.facts.find(
    (candidate) => candidate.label === HEADLINE_FACT[study.slug]
  )
  return fact
    ? [
        {
          slug: study.slug,
          name: study.name,
          category: study.category,
          figure: `${fact.value} ${fact.label.toLowerCase().replace("automated ", "")}`,
        },
      ]
    : []
})

function ProductList({ copy = false }: { copy?: boolean }) {
  return (
    <ul
      aria-hidden={copy || undefined}
      className={cn(
        "flex shrink-0 items-center gap-8 pr-8 lg:gap-12 lg:pr-0",
        copy && "lg:hidden"
      )}
    >
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`/work/${item.slug}`}
            tabIndex={copy ? -1 : undefined}
            className="group inline-flex min-h-11 items-center gap-2.5 text-sm whitespace-nowrap"
          >
            <span className="font-medium">{item.name}</span>
            <span className="text-muted-foreground">{item.category}</span>
            <span className="chip-brand px-1.5 py-0.5">{item.figure}</span>
            <ChevronRight
              className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ProofStrip() {
  return (
    <section
      aria-label="In production"
      className="overflow-x-clip border-t bg-background"
    >
      <div className="container-page py-2 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-10 lg:py-5">
        <p className="hidden text-sm text-muted-foreground lg:col-span-5 lg:block">
          Built and run by us
        </p>
        <div className="-mx-5 min-w-0 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] motion-reduce:overflow-x-auto md:-mx-8 lg:col-span-7 lg:col-start-6 lg:mx-0 lg:overflow-visible lg:[mask-image:none]">
          <div className="flex w-max animate-[ticker_32s_linear_infinite] hover:[animation-play-state:paused] lg:w-auto lg:animate-none">
            <ProductList />
            <ProductList copy />
          </div>
        </div>
      </div>
    </section>
  )
}
