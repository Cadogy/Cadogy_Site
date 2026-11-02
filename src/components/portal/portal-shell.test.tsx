import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { portalNavigation } from "./navigation"

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/billing/invoices/inv_1",
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}))
vi.mock("@/features/auth/client", () => ({ authClient: { signOut: vi.fn() } }))

const { PortalShell } = await import("./portal-shell")

const renderShell = ({ sidebarCollapsed = false } = {}) =>
  render(
    <PortalShell
      groups={portalNavigation("admin")}
      user={{ name: "Dylan", email: "dylan@example.com", role: "admin" }}
      sidebarCollapsed={sidebarCollapsed}
    >
      <h1>Invoices</h1>
    </PortalShell>
  )

describe("PortalShell", () => {
  it("groups the sidebar into studio and personal sections and marks the current page", () => {
    renderShell()
    const sidebar = screen.getByRole("navigation", { name: "Portal" })

    expect(
      within(sidebar).getByRole("heading", { name: "Studio" })
    ).toBeInTheDocument()
    expect(
      within(sidebar).getByRole("heading", { name: "My account" })
    ).toBeInTheDocument()
    expect(
      within(sidebar).getByRole("link", { name: "Invoices" })
    ).toHaveAttribute("aria-current", "page")
    expect(
      within(sidebar).getByRole("link", { name: "Overview" })
    ).not.toHaveAttribute("aria-current")
  })

  it("opens a full-screen menu with every destination on smaller screens", async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole("button", { name: "Open menu" }))
    const menu = await screen.findByRole("dialog", { name: "Menu" })

    expect(within(menu).getByRole("link", { name: "Users" })).toHaveAttribute(
      "href",
      "/admin/users"
    )
    expect(within(menu).getByRole("link", { name: "Account" })).toHaveAttribute(
      "href",
      "/account"
    )
  })

  it("collapses the sidebar to icons, keeps every link named and remembers the choice", async () => {
    const user = userEvent.setup()
    renderShell()

    await user.click(screen.getByRole("button", { name: "Collapse sidebar" }))

    expect(
      screen.getByRole("button", { name: "Expand sidebar" })
    ).toHaveAttribute("aria-expanded", "false")
    const sidebar = screen.getByRole("navigation", { name: "Portal" })
    expect(
      within(sidebar).getByRole("link", { name: "Invoices" })
    ).toHaveAttribute("aria-current", "page")
    expect(document.cookie).toContain("portal-sidebar=collapsed")
  })

  it("starts collapsed when the person collapsed it last time", () => {
    renderShell({ sidebarCollapsed: true })

    expect(
      screen.getByRole("button", { name: "Expand sidebar" })
    ).toBeInTheDocument()
  })

  it("toggles the sidebar with Ctrl+B", async () => {
    const user = userEvent.setup()
    renderShell()

    await user.keyboard("{Control>}b{/Control}")

    expect(
      screen.getByRole("button", { name: "Expand sidebar" })
    ).toBeInTheDocument()
  })
})
