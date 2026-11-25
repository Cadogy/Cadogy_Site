"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

const FRAME_MS = 60
const CLUSTER = 4

const toneOf = (canvas: HTMLCanvasElement, token: string) =>
  getComputedStyle(canvas).getPropertyValue(token).trim() || "220 100% 72%"

const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export function DotField({
  tone = "--brand",
  spacing = 14,
  clear = 0.56,
  className,
}: {
  tone?: string
  spacing?: number
  clear?: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext?.("2d")
    if (!canvas || !context) return
    const still =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
    const hue = toneOf(canvas, tone)
    const ink = toneOf(canvas, "--muted-foreground")
    const size = { width: 0, height: 0 }
    const state = { frame: 0, last: 0, visible: true }

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      size.width = canvas.clientWidth
      size.height = canvas.clientHeight
      canvas.width = Math.round(size.width * ratio)
      canvas.height = Math.round(size.height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const draw = (time: number) => {
      const { width, height } = size
      context.clearRect(0, 0, width, height)
      const t = time / 1000
      const half = width / 2
      const keep = half * clear
      const columns = Math.ceil(width / spacing)
      const rows = Math.ceil(height / spacing)
      for (let col = 0; col < columns; col++) {
        const x = col * spacing + spacing / 2
        const reach = (Math.abs(x - half) - keep) / (half - keep)
        if (reach <= 0) continue
        for (let row = 0; row < rows; row++) {
          const patch = noise(
            Math.floor(col / CLUSTER),
            Math.floor(row / CLUSTER)
          )
          if (patch > 0.25 + reach * 0.6) continue
          const seed = noise(col, row)
          if (seed < 0.35) continue
          const y = row * spacing + spacing / 2
          const lit = seed > 0.95
          const pulse = 0.5 + 0.5 * Math.sin(t * (0.6 + seed) + seed * 50)
          const alpha = lit
            ? 0.25 + pulse * 0.6
            : 0.1 + reach * 0.16 + (seed > 0.8 ? pulse * 0.08 : 0)
          context.fillStyle = `hsl(${lit ? hue : ink} / ${alpha.toFixed(3)})`
          context.fillRect(x - 0.75, y - 0.75, 1.5, 1.5)
        }
      }
    }

    const loop = (time: number) => {
      state.frame = requestAnimationFrame(loop)
      if (!state.visible || document.hidden || time - state.last < FRAME_MS)
        return
      state.last = time
      draw(time)
    }

    resize()
    draw(2000)
    const resizer = new ResizeObserver(() => {
      resize()
      draw(state.last || 2000)
    })
    resizer.observe(canvas)
    const observer = new IntersectionObserver(([entry]) => {
      state.visible = entry?.isIntersecting ?? false
    })
    observer.observe(canvas)
    if (!still) state.frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(state.frame)
      resizer.disconnect()
      observer.disconnect()
    }
  }, [tone, spacing, clear])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 size-full",
        className
      )}
    />
  )
}
