import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, onTestFinished } from "vitest"

import { services } from "../content"
import { ServiceExplorer } from "./service-explorer"

describe("ServiceExplorer", () => {
  it("offers a tab per service and opens on the first", () => {
    render(<ServiceExplorer />)

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(
      services.map((service) => service.title)
    )
    const panel = screen.getByRole("tabpanel")
    expect(panel).toHaveAccessibleName(services[0]?.title)
    for (const item of services[0]?.includes ?? [])
      expect(within(panel).getByText(item)).toBeVisible()
    expect(
      within(panel).getByRole("img", { name: services[0]?.capture.alt })
    ).toBeInTheDocument()
  })

  it("shows what the chosen service includes", async () => {
    const user = userEvent.setup()
    render(<ServiceExplorer />)

    await user.click(screen.getByRole("tab", { name: "Payments & commerce" }))

    const panel = screen.getByRole("tabpanel")
    expect(panel).toHaveAccessibleName("Payments & commerce")
    expect(
      within(panel).getByText("Stripe integrations and webhooks")
    ).toBeVisible()
  })

  it("opens the service named in the link that brought you here", () => {
    window.history.replaceState(null, "", "/services#infrastructure")
    onTestFinished(() => window.history.replaceState(null, "", "/"))
    render(<ServiceExplorer />)

    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(
      "Infrastructure & security"
    )
  })

  it("moves between services with the arrow keys", async () => {
    const user = userEvent.setup()
    render(<ServiceExplorer />)

    await user.click(screen.getByRole("tab", { name: "Product engineering" }))
    await user.keyboard("{ArrowDown}")

    expect(
      screen.getByRole("tab", { name: "Payments & commerce" })
    ).toHaveFocus()
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(
      "Payments & commerce"
    )
  })
})
