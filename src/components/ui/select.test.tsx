import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Select } from "./select"

const services = (
  <>
    <option value="">Choose a service…</option>
    <optgroup label="Hosting">
      <option value="web">Managed Website Hosting</option>
      <option value="wp">Managed WordPress Hosting</option>
    </optgroup>
    <optgroup label="Engineering">
      <option value="dev">Custom Development</option>
      <option value="old" disabled>
        Legacy Retainer
      </option>
    </optgroup>
  </>
)

const renderSelect = (props: Partial<Parameters<typeof Select>[0]> = {}) =>
  render(
    <form aria-label="form">
      <label htmlFor="service">Service</label>
      <Select id="service" name="service" {...props}>
        {services}
      </Select>
    </form>
  )

const formValue = () =>
  new FormData(screen.getByRole("form", { name: "form" })).get("service")

describe("Select", () => {
  it("shows the chosen option and submits its value with the form", () => {
    renderSelect({ defaultValue: "wp" })

    expect(screen.getByLabelText("Service")).toHaveValue(
      "Managed WordPress Hosting"
    )
    expect(formValue()).toBe("wp")
  })

  it("turns into a search box when opened and filters as you type", async () => {
    const user = userEvent.setup()
    renderSelect()
    const field = screen.getByRole("combobox", { name: "Service" })

    await user.click(field)
    expect(field).toHaveAttribute("aria-expanded", "true")
    await user.type(field, "wordpress")

    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["Managed WordPress Hosting"])
  })

  it("searches category names when no option name matches", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByLabelText("Service"))
    await user.keyboard("engineering")

    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["Custom Development", "Legacy Retainer"])
  })

  it("prefers option names over category names", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByLabelText("Service"))
    await user.keyboard("hosting")

    // Both Hosting services match by name; the category adds nothing more.
    expect(
      screen.getAllByRole("option").map((option) => option.textContent)
    ).toEqual(["Managed Website Hosting", "Managed WordPress Hosting"])
  })

  it("starts searching when you type on the closed field", async () => {
    const user = userEvent.setup()
    renderSelect()

    screen.getByLabelText("Service").focus()
    await user.keyboard("cus")

    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(screen.getAllByRole("option")).toHaveLength(1)
  })

  it("picks with the keyboard and reports the change", async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    renderSelect({ onChange })

    screen.getByLabelText("Service").focus()
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}")

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: "web" }),
      })
    )
    expect(formValue()).toBe("web")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("skips disabled options and closes on Escape without changing", async () => {
    const user = userEvent.setup()
    renderSelect({ defaultValue: "dev" })

    await user.click(screen.getByLabelText("Service"))
    await user.keyboard("{ArrowDown}{Enter}")
    expect(formValue()).toBe("")

    await user.click(screen.getByLabelText("Service"))
    await user.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(formValue()).toBe("")
  })

  it("says so when nothing matches", async () => {
    const user = userEvent.setup()
    renderSelect()

    await user.click(screen.getByLabelText("Service"))
    await user.keyboard("zzz")

    expect(screen.getByText("No matches")).toBeInTheDocument()
  })

  it("goes back to its starting value when the form resets", async () => {
    const user = userEvent.setup()
    renderSelect({ defaultValue: "web" })

    await user.click(screen.getByLabelText("Service"))
    await user.click(screen.getByRole("option", { name: "Custom Development" }))
    expect(formValue()).toBe("dev")
    screen.getByRole<HTMLFormElement>("form", { name: "form" }).reset()

    await waitFor(() =>
      expect(screen.getByLabelText("Service")).toHaveValue(
        "Managed Website Hosting"
      )
    )
    expect(formValue()).toBe("web")
  })

  it("follows a controlled value", () => {
    const { rerender } = render(
      <Select aria-label="Role" value="a" onChange={() => {}}>
        <option value="a">Billing</option>
        <option value="b">Viewer</option>
      </Select>
    )
    rerender(
      <Select aria-label="Role" value="b" onChange={() => {}}>
        <option value="a">Billing</option>
        <option value="b">Viewer</option>
      </Select>
    )

    expect(screen.getByRole("combobox", { name: "Role" })).toHaveValue("Viewer")
  })
})
