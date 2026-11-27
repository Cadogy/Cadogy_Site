import { RollingNumber } from "@/components/ui/rolling-number"

import { studioFigures } from "../content"

export function ProofFigures() {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-8">
      {studioFigures.map((figure) => (
        <div key={figure.label} className="flex flex-col">
          <dt className="order-2 mt-2 text-pretty text-muted-foreground">
            {figure.label}
          </dt>
          <dd className="order-1 text-h1 tabular-nums">
            <RollingNumber value={figure.value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
