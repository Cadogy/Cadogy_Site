import { Loader2 } from "lucide-react"

export const isAwaitingHumanCheck = (
  siteKey: string | undefined,
  token: string
) => Boolean(siteKey) && !token

export function HumanCheckPending({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <p
      role="status"
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <Loader2
        className="size-3.5 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      Checking you&apos;re human…
    </p>
  )
}
