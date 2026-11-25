import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ComparisonTable } from "./comparison-table"

const options = [
  { id: "fixed", title: "Fixed scope", note: "Most projects" },
  { id: "monthly", title: "Monthly" },
] as const

const rows = [
  { topic: "Best for", values: ["New products", "Teams that need capacity"] },
  { topic: "Priced", values: ["One clear price", "Billed monthly"] },
]

describe("ComparisonTable", () => {
  it("lays the options out as table columns with each topic as a row", () => {
    render(
      <ComparisonTable
        caption="Ways to work"
        options={options}
        rows={rows}
        highlight="fixed"
      />
    )
    const table = screen.getByRole("table", { name: "Ways to work" })

    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent)
    ).toEqual(["Topic", "Fixed scopeMost projects", "Monthly"])
    const priced = within(table).getByRole("row", { name: /Priced/ })
    expect(within(priced).getByRole("rowheader")).toHaveTextContent("Priced")
    expect(
      within(priced)
        .getAllByRole("cell")
        .map((cell) => cell.textContent)
    ).toEqual(["One clear price", "Billed monthly"])
  })

  it("stacks each option with its answers for small screens", () => {
    render(
      <ComparisonTable caption="Ways to work" options={options} rows={rows} />
    )
    const monthly = screen.getByRole("group", { name: "Monthly" })

    expect(within(monthly).getByText("Teams that need capacity")).toBeVisible()
    expect(within(monthly).getByText("Billed monthly")).toBeVisible()
  })
})
