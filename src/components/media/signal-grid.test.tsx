import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SignalGrid } from "./signal-grid"

describe("SignalGrid", () => {
  it("is decoration that assistive technology skips", () => {
    const { container } = render(<SignalGrid />)

    expect(container.querySelector("canvas")).toHaveAttribute(
      "aria-hidden",
      "true"
    )
  })

  it("renders quietly where canvas drawing isn't available", () => {
    expect(() => render(<SignalGrid cell={18} />)).not.toThrow()
  })

  it("can send its wave out from any point, such as behind a product shot", () => {
    expect(() =>
      render(
        <SignalGrid origin={[0.5, 1]} tone="--violet" peak={0.4} base={0.015} />
      )
    ).not.toThrow()
  })
})
