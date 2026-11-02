import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { ImpersonationBanner } from "./impersonation-banner"

describe("ImpersonationBanner", () => {
  it("says whose portal this is and that payments are off", () => {
    render(<ImpersonationBanner email="ada@example.com" onStop={vi.fn()} />)

    expect(screen.getByRole("status")).toHaveTextContent(
      "You're viewing the portal as ada@example.com. Payments and card changes are turned off."
    )
  })

  it("stops viewing as the client", async () => {
    const onStop = vi.fn(async () => {})
    const user = userEvent.setup()
    render(<ImpersonationBanner email="ada@example.com" onStop={onStop} />)

    await user.click(screen.getByRole("button", { name: "Stop viewing" }))

    expect(onStop).toHaveBeenCalled()
  })
})
