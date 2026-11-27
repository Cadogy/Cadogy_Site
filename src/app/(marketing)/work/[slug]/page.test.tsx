import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

const { default: CaseStudyPage, generateMetadata } = await import("./page")

const renderPlayerBay = async () =>
  render(
    await CaseStudyPage({ params: Promise.resolve({ slug: "playerbay" }) })
  )

describe("PlayerBay case study", () => {
  it("has a single h1 and links to the live product", async () => {
    await renderPlayerBay()

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    for (const link of screen.getAllByRole("link", { name: /playerbay\.com/ }))
      expect(link).toHaveAttribute("href", "https://playerbay.com")
  })

  it("tells the story in prose instead of a wall of figures", async () => {
    await renderPlayerBay()

    expect(
      screen.queryByRole("region", { name: "At a glance" })
    ).not.toBeInTheDocument()
    const challenge = screen.getByRole("region", { name: "The challenge" })
    expect(within(challenge).getAllByRole("paragraph").length).toBe(3)
    expect(
      screen.getByRole("region", { name: "Where it is now" })
    ).toHaveTextContent(/playerbay\.com/)
  })

  it("walks through an order from checkout to payout, step by step", async () => {
    await renderPlayerBay()
    const flow = screen.getByRole("region", { name: "How an order works" })

    expect(within(flow).getAllByRole("listitem").length).toBeGreaterThanOrEqual(
      5
    )
  })

  it("explains held funds, the ledger, fraud and operations in depth", async () => {
    await renderPlayerBay()

    for (const chapter of [
      "Holding the money in the middle",
      "Treating balances like money",
      "Keeping fraud out without slowing everyone down",
      "Running it with a small team",
    ]) {
      const section = screen.getByRole("region", { name: chapter })
      expect(
        within(section).getAllByRole("paragraph").length
      ).toBeGreaterThanOrEqual(2)
    }
  })

  it("sets one line large between chapters", async () => {
    await renderPlayerBay()

    expect(
      screen.getByRole("complementary", { name: "Key point" })
    ).toHaveTextContent(/marketplace promise/)
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
  it("has a single h1 and links to its website, the Marketplace listing and the source", async () => {
    await renderSidecar()

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Sidecar for OpenCode"
    )
    expect(
      screen.getByRole("link", { name: /^opencodesidecar\.com/ })
    ).toHaveAttribute("href", "https://www.opencodesidecar.com")
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
    const story = [...container.querySelectorAll("article section")]
      .map((section) => section.textContent)
      .join(" ")
    expect(story).not.toMatch(/buyer|order works|PlayerBay/i)
  })

  it("tells the release story, including what early users ran into", async () => {
    await renderSidecar()
    const shipping = screen.getByRole("region", { name: "Shipping in public" })

    expect(shipping).toHaveTextContent(/November 23, 2026/)
    expect(shipping).toHaveTextContent(/Windows/)
  })

  it("keeps to our voice", async () => {
    const { container } = await renderSidecar()

    expect(container.textContent).not.toMatch(
      /cutting-edge|world-class|revolutionary|synergy|AI-accelerated/i
    )
  })
})

const renderGracefulEra = async () =>
  render(
    await CaseStudyPage({
      params: Promise.resolve({ slug: "graceful-era-vitality" }),
    })
  )

describe("Graceful Era Vitality case study", () => {
  it("has a single h1 and never sends visitors to the password-protected preview", async () => {
    await renderGracefulEra()

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Graceful Era Vitality"
    )
    expect(
      screen.queryByRole("link", { name: /gracefulera\.com/ })
    ).not.toBeInTheDocument()
  })

  it("states the launch status in the project details instead of a link", async () => {
    await renderGracefulEra()
    const details = screen.getByRole("complementary", {
      name: "Project details",
    })

    expect(
      within(details).getByText("In private preview ahead of launch")
    ).toBeInTheDocument()
    expect(within(details).queryAllByRole("link")).toHaveLength(0)
  })

  it("explains how careful wording is kept, in prose", async () => {
    await renderGracefulEra()
    const wording = screen.getByRole("region", {
      name: "Making careful wording the default",
    })

    expect(wording).toHaveTextContent(/never says treats, cures or prevents/)
    expect(
      screen.queryByRole("region", { name: "At a glance" })
    ).not.toBeInTheDocument()
  })

  it("walks through the launch, from private preview to opening day", async () => {
    await renderGracefulEra()
    const flow = screen.getByRole("region", { name: "How the launch works" })

    expect(within(flow).getAllByRole("listitem").length).toBeGreaterThanOrEqual(
      5
    )
  })

  it("keeps the client's formulas, ingredients, suppliers and personal details private", async () => {
    const { container } = await renderGracefulEra()
    const text = container.textContent ?? ""

    expect(text).not.toMatch(
      /\bRadiance\b|\bRestore\b|Green Labs|cohosh|ashwagandha|\bmaca\b|magnesium|vitamin|\d+\s?mg\b|30 years|pharmac/i
    )
  })

  it("keeps to our voice", async () => {
    const { container } = await renderGracefulEra()

    expect(container.textContent).not.toMatch(
      /cutting-edge|world-class|revolutionary|synergy|AI-accelerated/i
    )
  })
})

const renderDisciples = async () =>
  render(
    await CaseStudyPage({
      params: Promise.resolve({ slug: "disciples-insurance" }),
    })
  )

describe("Disciples Insurance case study", () => {
  it("has a single h1 and links to the live site", async () => {
    await renderDisciples()

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Disciples Insurance"
    )
    expect(
      screen.getByRole("link", { name: /Visit disciplesinsurance\.com/ })
    ).toHaveAttribute("href", "https://www.disciplesinsurance.com")
  })

  it("explains that quoting uses the broker's existing rater instead of a rebuilt one", async () => {
    await renderDisciples()
    const quoting = screen.getByRole("region", {
      name: "Using the quoting tool he already trusts",
    })

    expect(quoting).toHaveTextContent(/comparative rater/)
  })

  it("walks through how an edit goes live", async () => {
    await renderDisciples()
    const flow = screen.getByRole("region", { name: "How a change goes live" })

    expect(within(flow).getAllByRole("listitem").length).toBeGreaterThanOrEqual(
      5
    )
  })

  it("doesn't claim work the project doesn't have", async () => {
    const { container } = await renderDisciples()

    expect(container.textContent).not.toMatch(
      /automated tests|CRM|carrier integration|\$800|500\+ families|cutting-edge|world-class/i
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

describe("case study sharing metadata", () => {
  it("keeps the site-wide Open Graph details alongside the study's own", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "playerbay" }),
    })

    expect(metadata.openGraph).toMatchObject({
      siteName: "Cadogy",
      locale: "en_US",
      url: "/work/playerbay",
      title: "PlayerBay case study · Cadogy",
      images: [{ url: "/images/studio/playerbay.webp" }],
    })
  })
})

describe("case study story layout", () => {
  it("links back to all work and on to the next case study", async () => {
    await renderPlayerBay()

    expect(screen.getByRole("link", { name: /All work/ })).toHaveAttribute(
      "href",
      "/work"
    )
    expect(
      screen.getByRole("link", {
        name: /Next case study.*Sidecar for OpenCode/,
      })
    ).toHaveAttribute("href", "/work/opencode-sidecar")
  })

  it("lists the project details", async () => {
    await renderSidecar()
    const details = screen.getByRole("complementary", {
      name: "Project details",
    })

    expect(within(details).getByText("Developer tool")).toBeInTheDocument()
    expect(within(details).getByText("TypeScript")).toBeInTheDocument()
  })

  it("captions the demo video as a figure", async () => {
    await renderSidecar()

    expect(screen.getByRole("figure", { name: /Fig. 1/ })).toBeInTheDocument()
  })
})
