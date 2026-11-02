import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SiteHeader } from "./site-header"

const session = vi.hoisted(() => ({ status: "unauthenticated" as string }))

vi.mock("@/features/auth/client", () => ({
  authClient: {
    useSession: () => ({
      data:
        session.status === "authenticated"
          ? {
              user: {
                id: "u_1",
                name: "Ada Lovelace",
                email: "ada@example.com",
                role: "client",
              },
            }
          : null,
      isPending: false,
    }),
  },
}))
vi.mock("next/navigation", () => ({
  usePathname: () => "/services",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))

describe("SiteHeader", () => {
  beforeEach(() => {
    session.status = "unauthenticated"
  })

  it("links to every primary section and marks the current page", () => {
    render(<SiteHeader />)
    const nav = screen.getByRole("navigation", { name: "Primary" })

    for (const label of ["Work", "Services", "About", "Articles"]) {
      expect(within(nav).getByRole("link", { name: label })).toBeInTheDocument()
    }
    expect(within(nav).getByRole("link", { name: "Services" })).toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  it("offers a project call-to-action and a way to sign in", () => {
    render(<SiteHeader />)
    expect(
      screen.getAllByRole("link", { name: "Start a project" })[0]
    ).toHaveAttribute("href", "/contact")
    expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute(
      "href",
      "/login"
    )
  })

  it("shows signed-in visitors their account menu instead of sign in", () => {
    session.status = "authenticated"
    render(<SiteHeader />)
    expect(
      screen.getByRole("button", { name: /account menu for Ada Lovelace/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: "Sign in" })
    ).not.toBeInTheDocument()
  })

  it("opens an accessible mobile menu with every destination", async () => {
    const user = userEvent.setup()
    render(<SiteHeader />)

    await user.click(screen.getByRole("button", { name: "Open menu" }))
    const menu = await screen.findByRole("dialog", { name: "Menu" })

    for (const label of [
      "Work",
      "Services",
      "About",
      "Articles",
      "Start a project",
    ]) {
      expect(
        within(menu).getByRole("link", { name: label })
      ).toBeInTheDocument()
    }

    await user.keyboard("{Escape}")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
