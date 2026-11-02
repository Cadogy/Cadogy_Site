import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const signOut = vi.hoisted(() => vi.fn(async () => ({ data: {}, error: null })))
const navigation = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }))

vi.mock("next/navigation", () => ({ useRouter: () => navigation }))
vi.mock("@/features/auth/client", () => ({ authClient: { signOut } }))

const { UserMenu } = await import("./user-menu")

const openMenu = async (role: "owner" | "admin" | "client") => {
  const user = userEvent.setup()
  render(
    <UserMenu user={{ name: "Ada Lovelace", email: "ada@example.com", role }} />
  )
  await user.click(screen.getByRole("button", { name: /account menu/i }))
  return { user, menu: await screen.findByRole("menu") }
}

describe("UserMenu", () => {
  beforeEach(() => {
    signOut.mockClear()
    navigation.replace.mockReset()
  })

  it("shows initials on the trigger", () => {
    render(
      <UserMenu
        user={{
          name: "Ada Lovelace",
          email: "ada@example.com",
          role: "client",
        }}
      />
    )
    expect(
      screen.getByRole("button", { name: /account menu/i })
    ).toHaveTextContent("AL")
  })

  it("gives clients their dashboard and account, without studio access", async () => {
    const { menu } = await openMenu("client")

    expect(within(menu).getByText("ada@example.com")).toBeInTheDocument()
    expect(
      within(menu).getByRole("menuitem", { name: "Dashboard" })
    ).toHaveAttribute("href", "/dashboard")
    expect(
      within(menu).getByRole("menuitem", { name: "Account and security" })
    ).toHaveAttribute("href", "/account")
    expect(
      within(menu).queryByRole("menuitem", { name: "Studio" })
    ).not.toBeInTheDocument()
    expect(within(menu).queryByText("Client")).not.toBeInTheDocument()
  })

  it("adds the studio and a role badge for staff", async () => {
    const { menu } = await openMenu("admin")

    expect(
      within(menu).getByRole("menuitem", { name: "Studio" })
    ).toHaveAttribute("href", "/admin")
    expect(within(menu).getByText("Admin")).toBeInTheDocument()
  })

  it("signs out and returns home", async () => {
    const { user, menu } = await openMenu("owner")

    await user.click(within(menu).getByRole("menuitem", { name: "Sign out" }))

    expect(signOut).toHaveBeenCalled()
    expect(navigation.replace).toHaveBeenCalledWith("/")
  })
})
