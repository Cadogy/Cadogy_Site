import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { DotField } from "./dot-field"

describe("DotField", () => {
  it("is decoration that assistive technology skips", () => {
    const { container } = render(<DotField />)

    expect(container.querySelector("canvas")).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })

  it("renders quietly where canvas drawing isn't available", () => {
    expect(() => render(<DotField clear={0.6} spacing={12} />)).not.toThrow()
  })
})
