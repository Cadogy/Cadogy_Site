import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

const reply = vi.hoisted(() => ({
  result: { ok: true, message: "Reply sent." },
}))

vi.mock("../server/actions", () => ({
  openTicketAction: async () => null,
  replyToTicketAction: async () => reply.result,
  setTicketStatusAction: async () => undefined,
}))

const { ReplyForm } = await import("./ticket-forms")

const sendReply = async (text: string) => {
  const user = userEvent.setup()
  render(<ReplyForm ticketId="t_1" as="user" />)
  await user.type(screen.getByLabelText("Reply"), text)
  await user.click(screen.getByRole("button", { name: "Send reply" }))
}

describe("ReplyForm", () => {
  it("keeps the reply when it can't be sent", async () => {
    reply.result = {
      ok: false,
      message: "Write at least 10 characters",
    }

    await sendReply("Too short")

    expect(
      await screen.findByText("Write at least 10 characters")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Reply")).toHaveValue("Too short")
  })

  it("clears the box once the reply is sent", async () => {
    reply.result = { ok: true, message: "Reply sent." }

    await sendReply("Thanks, that fixed it for us.")

    expect(await screen.findByText("Reply sent.")).toBeInTheDocument()
    expect(screen.getByLabelText("Reply")).toHaveValue("")
  })
})
