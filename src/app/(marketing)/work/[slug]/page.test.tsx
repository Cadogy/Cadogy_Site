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

const renderSidecar = async () =>
  render(
    await CaseStudyPage({
      params: Promise.resolve({ slug: "opencode-sidecar" }),
    })
  )

describe("Sidecar for OpenCode case study", () => {
  it("has a single h1 and links to the Marketplace listing and the source", async () => {
    await renderSidecar()

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sidecar for OpenCode"
    )
    expect(
      screen.getByRole("link", { name: /marketplace\.visualstudio\.com/ })
    ).toHaveAttribute(
      "href",
      "https://marketplace.visualstudio.com/items?itemName=cadogy.opencode-sidecar"
    )
    expect(screen.getByRole("link", { name: /github\.com/ })).toHaveAttribute(
      "href",
      "https://github.com/charlesknapp/opencode-sidecar"
    )
  })

  it("tells its own story instead of PlayerBay's", async () => {
    const { container } = await renderSidecar()

    expect(
      screen.getByRole("region", { name: "How a prompt works" })
    ).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/buyer|order works|PlayerBay/i)
  })

  it("states figures counted from the extension's code and tests", async () => {
    await renderSidecar()
    const facts = screen.getByRole("region", { name: "At a glance" })

    expect(within(facts).getByText("Unit tests")).toBeInTheDocument()
    expect(within(facts).getByText("414")).toBeInTheDocument()
    expect(within(facts).getByText("99")).toBeInTheDocument()
    expect(within(facts).getByText(/Sidecar's source code/)).toBeInTheDocument()
  })

  it("keeps to our voice", async () => {
    const { container } = await renderSidecar()

    expect(container.textContent).not.toMatch(
      /cutting-edge|world-class|revolutionary|synergy|AI-accelerated/i
    )
  })
})

describe("case study videos", () => {
  it("offers the Sidecar demo without loading YouTube until it's played", async () => {
    await renderSidecar()
    const demo = screen.getByRole("region", { name: "Watch the demo" })

    expect(
      within(demo).getByRole("button", {
        name: /Play video: Sidecar for OpenCode/,
      })
    ).toBeInTheDocument()
    expect(demo.querySelector("iframe")).toBeNull()
  })

  it("leaves the section out when a case study has no video", async () => {
    await renderPlayerBay()

    expect(
      screen.queryByRole("region", { name: "Watch the demo" })
    ).not.toBeInTheDocument()
  })
})
