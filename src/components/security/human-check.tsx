"use client"

import { useSyncExternalStore } from "react"
import { Turnstile } from "next-turnstile"

const NARROW = "(max-width: 379px)"

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(NARROW)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const useNarrowViewport = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false
  )

export function HumanCheck({
  siteKey,
  onToken,
}: {
  siteKey: string | undefined
  onToken: (token: string) => void
}) {
  const narrow = useNarrowViewport()
  if (!siteKey) return null
  return (
    <Turnstile
      key={narrow ? "compact" : "normal"}
      siteKey={siteKey}
      theme="auto"
      size={narrow ? "compact" : "normal"}
      onVerify={onToken}
      onExpire={() => onToken("")}
      onError={() => onToken("")}
    />
  )
}
