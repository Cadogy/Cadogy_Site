import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

const { default: AboutPage } = await import("./page")

describe("About page", () => {
  it("has a single h1", () => {
    render(<AboutPage />)

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
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

  it("backs its claims with figures from the case studies, each linked to its source", () => {
    render(<AboutPage />)
    const proof = screen.getByRole("region", {
      name: /Numbers we can show you/,
    })
    const figure = (label: string) =>
      within(proof).getByText(label).closest("div") ?? document.body

    expect(
      within(figure("Automated test files")).getByText("3,200+")
    ).toBeVisible()
    expect(
      within(figure("Automated test files")).getByRole("link", {
        name: /PlayerBay/,
      })
    ).toHaveAttribute("href", "/work/playerbay")
    expect(within(figure("Unit tests")).getByText("414")).toBeVisible()
    expect(
      within(figure("Unit tests")).getByRole("link", {
        name: /Sidecar for OpenCode/,
      })
    ).toHaveAttribute("href", "/work/opencode-sidecar")
  })
})
