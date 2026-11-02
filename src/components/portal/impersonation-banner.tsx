"use client"

import { useTransition } from "react"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ImpersonationBanner({
  email,
  onStop,
}: {
  email: string
  onStop: () => Promise<void>
}) {
  const [pending, start] = useTransition()
  return (
    <div className="sticky top-0 z-40 border-b border-warning/40 bg-background">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <Eye className="size-4 text-warning" aria-hidden="true" />
        <p role="status" className="flex-1 text-sm">
          You&apos;re viewing the portal as {email}. Payments and card changes
          are turned off.
        </p>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => start(onStop)}
        >
          Stop viewing
        </Button>
      </div>
    </div>
  )
}
