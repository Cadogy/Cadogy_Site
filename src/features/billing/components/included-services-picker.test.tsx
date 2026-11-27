import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import {
  IncludedServicesPicker,
  ServiceChoicesProvider,
} from "./included-services-picker"

const groups = [
  {
    name: "Hosting",
    items: [
      { id: "host", name: "Managed Website Hosting", priceLabel: "$49.00" },
      { id: "backup", name: "Automated Backups", priceLabel: "$25.00" },
    ],
  },
  {
    name: "Care plans",
    items: [{ id: "care", name: "Essential Care", priceLabel: "$149.00" }],
  },
]

const renderPicker = () =>
  render(
    <ServiceChoicesProvider groups={groups}>
      <form aria-label="service">
        <IncludedServicesPicker selected={["host"]} excludeId="care" />
      </form>
    </ServiceChoicesProvider>
  )

const submitted = () =>
  new FormData(screen.getByRole("form", { name: "service" })).getAll(
    "includedItemIds"
  )

describe("IncludedServicesPicker", () => {
  it("keeps the current contents when saved without opening it", () => {
    renderPicker()

    expect(screen.queryByRole("checkbox")).toBeNull()
    expect(screen.getByText(/1: Managed Website Hosting/)).toBeInTheDocument()
    expect(submitted()).toEqual(["host"])
  })

  it("offers every other service once opened", async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.click(screen.getByText("Included services"))
    await user.click(
      screen.getByRole("checkbox", { name: /Automated Backups/ })
    )

    expect(
      screen.queryByRole("checkbox", { name: /Essential Care/ })
    ).toBeNull()
    expect(submitted()).toEqual(["host", "backup"])
  })

  it("still submits ticked services hidden by the filter", async () => {
    const user = userEvent.setup()
    renderPicker()

    await user.click(screen.getByText("Included services"))
    await user.type(screen.getByPlaceholderText("Filter services"), "backup")

    expect(submitted()).toEqual(["host"])
  })
})
