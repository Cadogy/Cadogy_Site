"use client"

import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

const FRAME_MS = 50
const CORNER = [1, 1] as const

const toneOf = (canvas: HTMLCanvasElement, token: string) =>
  getComputedStyle(canvas).getPropertyValue(token).trim() || "220 100% 72%"

const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return n - Math.floor(n)
}

export function SignalGrid({
  tone = "--brand",
  cell = 22,
  origin = CORNER,
  peak = 0.85,
  base = 0.06,
  className,
}: {
  tone?: string
  cell?: number
  origin?: readonly [number, number]
  peak?: number
  base?: number
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
      const columns = Math.ceil(width / cell)
      const rows = Math.ceil(height / cell)
      const [ox, oy] = origin
      const fromX = width * ox
      const fromY = height * oy
      const reach = Math.hypot(
        width * Math.max(ox, 1 - ox),
        height * Math.max(oy, 1 - oy)
      )
      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          const x = col * cell
          const y = row * cell
          const seed = noise(col, row)
          const distance = Math.hypot(fromX - x, fromY - y) / reach
          const wave = 0.5 + 0.5 * Math.sin(t * 0.9 - distance * 14 + seed * 2)
          const glow = wave ** 6 * (1 - distance) ** 1.5
          const twinkle =
            seed > 0.94 ? 0.25 * (0.5 + 0.5 * Math.sin(t * 1.6 + seed * 40)) : 0
          const alpha = Math.min(base + glow * 0.75 + twinkle, peak)
          context.fillStyle = `hsl(${hue} / ${alpha.toFixed(3)})`
          context.fillRect(x + 1, y + 1, cell - 3, cell - 3)
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
  }, [tone, cell, origin, peak, base])

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
