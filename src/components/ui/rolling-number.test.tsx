import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RollingNumber } from "./rolling-number"

describe("RollingNumber", () => {
  it("reads as the plain value, whatever the animation does", () => {
    render(<RollingNumber value="3,200+" />)

    expect(screen.getByText("3,200+")).toHaveClass("sr-only")
  })

  it("gives each digit its own rolling column and keeps punctuation still", () => {
    const { container } = render(<RollingNumber value="3,200+" />)

    expect(container.querySelectorAll('[data-slot="digit"]')).toHaveLength(4)
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(
      "3,200+"
    )
  })
})
