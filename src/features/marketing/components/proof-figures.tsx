import { RollingNumber } from "@/components/ui/rolling-number"
import { TextLink } from "@/components/ui/text-link"

import { proofFigures } from "../content"

export function ProofFigures() {
  return (
    <dl className="grid gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10">
      {proofFigures.map((figure) => (
        <div
          key={`${figure.study.slug}-${figure.label}`}
          className="flex flex-col"
        >
          <dt className="order-2 mt-2 text-muted-foreground">{figure.label}</dt>
          <dd className="order-1 text-h1 tabular-nums">
            <RollingNumber value={figure.value} />
          </dd>
          <dd className="order-3">
            <TextLink href={`/work/${figure.study.slug}`}>
              {figure.study.name}
            </TextLink>
          </dd>
        </div>
      ))}
    </dl>
  )
}
