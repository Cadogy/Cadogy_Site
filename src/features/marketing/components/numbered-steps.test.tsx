import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { NumberedSteps } from "./numbered-steps"

describe("NumberedSteps", () => {
  it("lists the steps in order with two-digit numbers", () => {
    render(
      <NumberedSteps
        label="How a project starts"
        steps={["Write to us", "Talk"]}
      />
    )
    const items = within(
      screen.getByRole("list", { name: "How a project starts" })
    ).getAllByRole("listitem")

    expect(items.map((item) => item.textContent)).toEqual([
      "01Write to us",
      "02Talk",
    ])
  })
})
