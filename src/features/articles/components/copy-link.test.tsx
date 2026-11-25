import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { CopyLink } from "./copy-link"

describe("CopyLink", () => {
  it("copies the article's address and confirms it", async () => {
    const user = userEvent.setup()
    render(<CopyLink url="https://cadogy.com/articles/cloudflare" />)

    await user.click(screen.getByRole("button", { name: "Copy link" }))

    expect(await navigator.clipboard.readText()).toBe(
      "https://cadogy.com/articles/cloudflare"
    )
    expect(screen.getByRole("status")).toHaveTextContent("Link copied")
  })
})
