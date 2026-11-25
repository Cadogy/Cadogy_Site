import type { ComponentProps } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PendingButton({
  pending,
  disabled,
  children,
  ...props
}: ComponentProps<typeof Button> & { pending: boolean }) {
  return (
    <Button {...props} disabled={pending || disabled}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </Button>
  )
}
