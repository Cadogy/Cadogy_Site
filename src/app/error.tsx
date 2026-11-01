"use client"

import { useEffect } from "react"

import { reloadOnceForChunkError } from "@/lib/chunk-reload"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (
      reloadOnceForChunkError(error, window.sessionStorage, () =>
        window.location.reload()
      )
    )
      return
    console.error(error)
  }, [error])

  return (
    <main className="container-page flex min-h-[60dvh] flex-col items-start justify-center py-24">
      <p className="text-meta">Something went wrong</p>
      <h1 className="mt-3 text-h2">We couldn&apos;t load this page.</h1>
      <p className="mt-4 max-w-xl text-lead">
        Please try again. If the problem continues, email hello@cadogy.com.
      </p>
      <Button className="mt-8" size="lg" onClick={reset}>
        Try again
      </Button>
    </main>
  )
}
