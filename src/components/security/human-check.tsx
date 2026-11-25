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
    <div className="flex justify-center">
      <Turnstile
        key={narrow ? "compact" : "normal"}
        siteKey={siteKey}
        theme="dark"
        size={narrow ? "compact" : "normal"}
        appearance="interaction-only"
        retry="auto"
        refreshExpired="auto"
        onVerify={onToken}
        onExpire={() => onToken("")}
        onError={() => onToken("")}
      />
    </div>
  )
}
