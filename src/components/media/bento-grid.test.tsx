import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { BentoGrid, type BentoItem } from "./bento-grid"

const item = (overrides: Partial<BentoItem> = {}): BentoItem => ({
  id: "payments",
  title: "Payments & commerce",
  description: "Checkout, payouts and invoicing built for real money.",
  href: "/services#payments",
  image: "/images/studio/services-payments-invoice.webp",
  alt: "A Cadogy invoice with sample data",
  span: "narrow",
  ...overrides,
})

describe("BentoGrid", () => {
  it("shows every item in order with its number, title, description and capture", () => {
    render(
      <BentoGrid
        label="Services"
        items={[
          item({ id: "product", title: "Product engineering", span: "wide" }),
          item(),
        ]}
      />
    )

    const cells = within(screen.getByRole("list", { name: "Services" }))
      .getAllByRole("listitem")
      .map((cell) => within(cell))

    expect(cells).toHaveLength(2)
    expect(cells[0]?.getByText("01")).toBeInTheDocument()
    expect(
      cells[0]?.getByRole("heading", { level: 3, name: "Product engineering" })
    ).toBeInTheDocument()
    expect(cells[1]?.getByText("02")).toBeInTheDocument()
    expect(
      cells[1]?.getByText(
        "Checkout, payouts and invoicing built for real money."
      )
    ).toBeVisible()
    expect(
      cells[1]?.getByRole("img", { name: "A Cadogy invoice with sample data" })
    ).toBeInTheDocument()
  })

  it("makes each cell a link to its detail", () => {
    render(<BentoGrid label="Services" items={[item()]} />)

    expect(
      screen.getByRole("link", { name: "Payments & commerce" })
    ).toHaveAttribute("href", "/services#payments")
  })
})
