"use client"

import { useTransition } from "react"

import { Button } from "@/components/ui/button"

import { setClientArchivedAction } from "../server/actions"

export function ClientArchiveButton({
  clientId,
  archived,
}: {
  clientId: string
  archived: boolean
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(
          async () => void (await setClientArchivedAction(clientId, !archived))
        )
      }
    >
      {archived ? "Restore client" : "Archive client"}
    </Button>
  )
}
