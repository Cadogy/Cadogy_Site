import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

const { default: CaseStudyPage } = await import("./page")

const renderPlayerBay = async () =>
  render(
    await CaseStudyPage({ params: Promise.resolve({ slug: "playerbay" }) })
  )

describe("PlayerBay case study", () => {
  it("has a single h1 and links to the live product", async () => {
    await renderPlayerBay()

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(
      screen.getByRole("link", { name: /playerbay\.com/ })
    ).toHaveAttribute("href", "https://playerbay.com")
  })

  it("states facts we can verify from the codebase", async () => {
    await renderPlayerBay()
    const facts = screen.getByRole("region", { name: "At a glance" })

    expect(within(facts).getByText("Languages")).toBeInTheDocument()
    expect(within(facts).getByText("25")).toBeInTheDocument()
    expect(within(facts).getByText("Currencies")).toBeInTheDocument()
    expect(within(facts).getByText("10")).toBeInTheDocument()
  })

  it("walks through an order from checkout to payout, step by step", async () => {
    await renderPlayerBay()
    const flow = screen.getByRole("region", { name: "How an order works" })

    expect(within(flow).getAllByRole("listitem").length).toBeGreaterThanOrEqual(
      5
    )
  })

  it("covers trust, payments, sellers, operations and reach in depth", async () => {
    await renderPlayerBay()

    for (const chapter of [
      "Trust and safety",
      "Money and payments",
      "Tools for sellers",
      "Running the marketplace",
      "A global storefront",
      "Engineering quality",
    ])
      expect(
        screen.getByRole("heading", { level: 2, name: chapter })
      ).toBeInTheDocument()
  })

  it("keeps to our voice: no hype and no pitching our own use of AI", async () => {
    const { container } = await renderPlayerBay()
    const text = container.textContent ?? ""

    expect(text).not.toMatch(/cutting-edge|world-class|revolutionary|synergy/i)
    expect(text).not.toMatch(/AI-accelerated|AI at every step/i)
  })
})
