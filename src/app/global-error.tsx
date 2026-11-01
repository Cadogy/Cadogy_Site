"use client"

import { useEffect } from "react"

import { reloadOnceForChunkError } from "@/lib/chunk-reload"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
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
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "4rem 1.5rem",
          background: "#09090b",
          color: "#fafafa",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>
          Something went wrong.
        </h1>
        <p style={{ color: "#a1a1aa" }}>
          Please refresh the page. If the problem continues, email
          hello@cadogy.com.
        </p>
      </body>
    </html>
  )
}
