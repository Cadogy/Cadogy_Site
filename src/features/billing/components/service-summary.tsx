import type { StoredAddOn } from "../application/engine-ports"
import { formatMoney, intervalLabel } from "../domain/format"

export function ServiceSummary({
  service,
  detail,
}: {
  service: Pick<
    StoredAddOn,
    "name" | "quantity" | "unitAmount" | "currency" | "interval"
  >
  detail: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <div>
        <p className="font-medium">
          {service.name}
          {service.quantity > 1 ? (
            <span className="text-muted-foreground"> × {service.quantity}</span>
          ) : null}
        </p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </div>
      <p className="tabular-nums">
        {formatMoney(service.unitAmount * service.quantity, service.currency)}{" "}
        <span className="text-muted-foreground">
          {intervalLabel(service.interval, "per")}
        </span>
      </p>
    </div>
  )
}
