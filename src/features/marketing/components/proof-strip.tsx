import Link from "next/link"
import { ChevronRight } from "lucide-react"

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

export function ProofStrip() {
  return (
    <section aria-label="In production" className="border-t bg-background">
      <div className="container-page flex flex-col gap-4 py-5 md:flex-row md:items-center md:gap-10">
        <p className="shrink-0 text-sm text-muted-foreground">
          Built and run by us
        </p>
        <ul className="flex flex-col gap-2 md:flex-row md:gap-8">
          {items.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/work/${item.slug}`}
                className="group inline-flex min-h-11 items-center gap-2.5 text-sm"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.category}</span>
                <span className="rounded-chip border bg-card px-1.5 py-0.5 font-mono text-xs text-brand">
                  {item.figure}
                </span>
                <ChevronRight
                  className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
