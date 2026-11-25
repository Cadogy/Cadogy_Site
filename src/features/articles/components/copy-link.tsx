"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Copy link"
        onClick={() => void copy()}
      >
        {copied ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Link2 className="size-4" aria-hidden="true" />
        )}
      </Button>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </>
  )
}
