import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MediaCard } from "./media-card"

describe("MediaCard", () => {
  it("shows the title and description without any hover interaction", () => {
    render(
      <MediaCard
        image="/images/studio/payments.webp"
        alt=""
        title="Payments & commerce"
        description="Checkout, payouts, escrow and invoicing built for real money."
        href="/services#payments"
      />
    )

    expect(
      screen.getByRole("heading", { name: "Payments & commerce" })
    ).toBeVisible()
    expect(screen.getByText(/Checkout, payouts, escrow/)).toBeVisible()
  })

  it("makes the whole card a single link to its destination", () => {
    render(
      <MediaCard
        image="/x.webp"
        alt=""
        title="AI integration"
        description="LLM features."
        href="/services#ai"
      />
    )
    expect(screen.getAllByRole("link")).toHaveLength(1)
    expect(
      screen.getByRole("link", { name: "AI integration" })
    ).toHaveAttribute("href", "/services#ai")
  })
})
