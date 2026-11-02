import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { cn } from "./utils"

const css = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8")
const typeScale = [...css.matchAll(/@utility (text-[a-z0-9-]+)/g)].map(
  ([, name]) => name ?? ""
)
const radii = [...css.matchAll(/--radius-([a-z]+):/g)].map(
  ([, name]) => `rounded-${name ?? ""}`
)

describe("cn", () => {
  it("knows every size in our type scale, so a text color never drops it", () => {
    expect(typeScale.length).toBeGreaterThan(5)
    for (const size of typeScale)
      expect(cn(size, "text-muted-foreground")).toBe(
        `${size} text-muted-foreground`
      )
  })

  it("lets a later size replace an earlier one", () => {
    expect(cn("text-sm", "text-h3")).toBe("text-h3")
  })

  it("knows every radius token", () => {
    expect(radii.length).toBeGreaterThan(0)
    for (const radius of radii) expect(cn("rounded-full", radius)).toBe(radius)
  })
})
