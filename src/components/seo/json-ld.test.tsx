import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { JsonLd } from "./json-ld"

describe("JsonLd", () => {
  it("cannot be used to break out of the script tag", () => {
    const { container } = render(
      <JsonLd data={{ name: "</script><script>alert(1)</script>" }} />
    )
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script?.innerHTML).not.toContain("</script>")
    expect(JSON.parse(script?.textContent ?? "{}").name).toBe(
      "</script><script>alert(1)</script>"
    )
  })
})
