import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, onTestFinished } from "vitest"

import { services } from "../content"
import { ServiceExplorer } from "./service-explorer"

const openService = () => screen.getByRole("region")

describe("ServiceExplorer", () => {
  it("lists every service, numbered, with the first one open", () => {
    render(<ServiceExplorer />)

    const toggles = screen.getAllByRole("button")
    expect(toggles.map((toggle) => toggle.textContent)).toEqual(
      services.map(
        (service, index) =>
          `${String(index + 1).padStart(2, "0")}${service.title}`
      )
    )
    expect(toggles[0]).toHaveAttribute("aria-expanded", "true")
    expect(openService()).toHaveAccessibleName(/Product engineering/)
    expect(
      within(openService()).getByText(services[0]?.detail ?? "")
    ).toBeVisible()
    for (const item of services[0]?.includes ?? [])
      expect(within(openService()).getByText(item)).toBeVisible()
    expect(
      within(openService()).getByRole("img", { name: services[0]?.capture.alt })
    ).toBeInTheDocument()
  })

  it("opens one service at a time", async () => {
    const user = userEvent.setup()
    render(<ServiceExplorer />)

    await user.click(
      screen.getByRole("button", { name: /Payments & commerce/ })
    )

    expect(screen.getAllByRole("region")).toHaveLength(1)
    expect(openService()).toHaveAccessibleName(/Payments & commerce/)
    expect(
      within(openService()).getByText("Stripe integrations and webhooks")
    ).toBeVisible()
    expect(
      screen.getByRole("button", { name: /Product engineering/ })
    ).toHaveAttribute("aria-expanded", "false")
  })

  it("opens the service named in the link that brought you here", () => {
    window.history.replaceState(null, "", "/services#infrastructure")
    onTestFinished(() => window.history.replaceState(null, "", "/"))
    render(<ServiceExplorer />)

    expect(openService()).toHaveAccessibleName(/Infrastructure & security/)
  })
})
