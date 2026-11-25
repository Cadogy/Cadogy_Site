import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TextLink } from "./text-link"

describe("TextLink", () => {
  it("links within the site in the same tab", () => {
    render(<TextLink href="/dashboard/billing">View all</TextLink>)

    const link = screen.getByRole("link", { name: "View all" })
    expect(link).toHaveAttribute("href", "/dashboard/billing")
    expect(link).not.toHaveAttribute("target")
  })

  it("opens outside sites in a new tab without sharing the opener", () => {
    render(
      <TextLink href="https://playerbay.com" external>
        Visit playerbay.com
      </TextLink>
    )

    const link = screen.getByRole("link", { name: "Visit playerbay.com" })
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })
})
