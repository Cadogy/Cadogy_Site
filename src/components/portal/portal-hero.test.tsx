import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PortalHero } from "./portal-hero"

describe("PortalHero", () => {
  it("leads the page with its one heading, context, actions and key figures", () => {
    const { container } = render(
      <PortalHero
        title="Good morning, Maya"
        meta="Northwind Labs"
        description="Two invoices are open."
        actions={<a href="/pay">Pay balance</a>}
      >
        <p>Balance due $13,500.00</p>
      </PortalHero>
    )

    expect(
      screen.getByRole("heading", { level: 1, name: "Good morning, Maya" })
    ).toBeInTheDocument()
    expect(screen.getByText("Northwind Labs")).toBeInTheDocument()
    expect(screen.getByText("Two invoices are open.")).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Pay balance" })
    ).toBeInTheDocument()
    expect(screen.getByText("Balance due $13,500.00")).toBeInTheDocument()
    expect(container.querySelector("canvas")).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })
})
