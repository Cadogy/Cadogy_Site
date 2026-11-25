import { processSteps, services } from "@/features/marketing/content"
import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

const { default: ServicesPage } = await import("./page")

describe("Services page", () => {
  it("has a single h1", () => {
    render(<ServicesPage />)

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("lets visitors explore every service, one at a time, with a real capture", () => {
    render(<ServicesPage />)

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(
      services.map((service) => service.title)
    )
    expect(
      within(screen.getByRole("tabpanel")).getByRole("img", {
        name: services[0]?.capture.alt,
      })
    ).toBeInTheDocument()
  })

  it("shows each step of the process with a real example of it", () => {
    render(<ServicesPage />)
    const steps = within(
      screen.getByRole("list", { name: "Our process" })
    ).getAllByRole("listitem")

    expect(steps).toHaveLength(processSteps.length)
    processSteps.forEach((step, index) =>
      expect(
        within(steps[index] ?? document.body).getByRole("img", {
          name: step.example.alt,
        })
      ).toBeInTheDocument()
    )
  })

  it("compares the ways to work side by side, noting that most projects are fixed-scope", () => {
    render(<ServicesPage />)
    const table = screen.getByRole("table", { name: "Ways to work with us" })

    expect(
      within(table).getByRole("columnheader", { name: /Fixed-scope projects/ })
    ).toHaveTextContent("Most projects")
    expect(
      within(table).getByRole("row", { name: /How it's priced/ })
    ).toHaveTextContent("Billed monthly")
  })
})
