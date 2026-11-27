import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

const { default: AboutPage } = await import("./page")

describe("About page", () => {
  it("has a single h1", () => {
    render(<AboutPage />)

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("shows both founders together, each named with their role", () => {
    render(<AboutPage />)
    const founders = screen.getByRole("figure", {
      name: /Charles Knapp\s*, Co-Founder & CTO.*Dylan Safra\s*, Co-Founder & CFO/,
    })

    expect(
      within(founders).getByRole("img", {
        name: "Charles Knapp and Dylan Safra, Cadogy's founders",
      })
    ).toBeInTheDocument()
  })

  it("has an in-page index that links to each section", () => {
    const { container } = render(<AboutPage />)
    const index = screen.getByRole("navigation", { name: "On this page" })

    for (const link of within(index).getAllByRole("link")) {
      const target = link.getAttribute("href")?.slice(1) ?? ""
      expect(container.querySelector(`#${target}`)).not.toBeNull()
    }
    expect(within(index).getAllByRole("link")).toHaveLength(5)
  })

  it("shows the studio's track record", () => {
    render(<AboutPage />)
    const proof = screen.getByRole("region", { name: /The track record/ })
    const figure = (label: string) =>
      within(proof).getByText(label).closest("div") ?? document.body

    expect(
      within(figure("Years of combined experience")).getByText("15+")
    ).toBeVisible()
    expect(within(figure("Projects shipped")).getByText("100+")).toBeVisible()
    expect(within(figure("Clients served")).getByText("25+")).toBeVisible()
    expect(within(figure("Industries served")).getByText("10+")).toBeVisible()
    expect(figure("Years in business")).toHaveTextContent(
      String(new Date().getFullYear() - 2020)
    )
  })
})
