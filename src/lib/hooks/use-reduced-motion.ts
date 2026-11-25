import { useSyncExternalStore } from "react"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

const subscribeToMotion = (onChange: () => void) => {
  if (typeof window.matchMedia !== "function") return () => undefined
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(REDUCED_MOTION).matches

export const useReducedMotion = () =>
  useSyncExternalStore(subscribeToMotion, prefersReducedMotion, () => true)
