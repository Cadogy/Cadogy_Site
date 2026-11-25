import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import MarketingNotFound from "./not-found"

describe("Marketing not found page", () => {
  it("explains the missing page without adding a second header or footer", () => {
    const { container } = render(<MarketingNotFound />)

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "This page doesn't exist.",
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Read our articles" })
    ).toHaveAttribute("href", "/articles")
    expect(container.querySelector("header, footer")).toBeNull()
  })
})
