import { useEffect, useState } from "react"

export const useInView = (ref: React.RefObject<HTMLElement | null>) => {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const element = ref.current
    if (!element || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry?.isIntersecting ?? true)
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return inView
}
