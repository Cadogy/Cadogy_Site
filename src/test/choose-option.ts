import { screen, within } from "@testing-library/react"
import type userEvent from "@testing-library/user-event"

type User = ReturnType<typeof userEvent.setup>

/** Opens a Select and picks an option by its value or its label. */
export const chooseOption = async (
  user: User,
  combobox: HTMLElement,
  option: string
) => {
  await user.click(combobox)
  const match = within(screen.getByRole("listbox"))
    .getAllByRole("option")
    .find(
      (element) =>
        element.dataset.value === option || element.textContent === option
    )
  if (!match) throw new Error(`No option "${option}" in the dropdown`)
  await user.click(match)
}
