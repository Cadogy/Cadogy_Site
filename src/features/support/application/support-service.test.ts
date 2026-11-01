// @vitest-environment node
import { describe, expect, it } from "vitest"

import {
  createSupportService,
  type SupportTicket,
  type TicketNotification,
} from "./support-service"

const NOW = new Date("2026-11-01T12:00:00.000Z")
const client = { id: "user-1", email: "ada@example.com", name: "Ada" }
const otherClient = { id: "user-2", email: "eve@example.com", name: "Eve" }
const admin = { id: "admin-1", email: "hello@cadogy.com", name: "Charles" }

const setup = () => {
  const tickets = new Map<string, SupportTicket>()
  const notifications: TicketNotification[] = []
  let counter = 0
  const service = createSupportService({
    clock: () => NOW,
    store: {
      insert: async (ticket) => {
        const stored = { ...ticket, id: `t${++counter}` }
        tickets.set(stored.id, stored)
        return stored
      },
      save: async (ticket) => {
        tickets.set(ticket.id, ticket)
        return ticket
      },
      find: async (id) => tickets.get(id) ?? null,
      list: async (filter) =>
        [...tickets.values()].filter(
          (ticket) =>
            (!filter.userId || ticket.userId === filter.userId) &&
            (!filter.status || ticket.status === filter.status)
        ),
    },
    notify: async (notification) => {
      notifications.push(notification)
    },
  })
  return { service, notifications }
}

const expectOk = <T>(
  result: { ok: true; value: T } | { ok: false; error: string }
) => {
  if (!result.ok) throw new Error(result.error)
  return result.value
}

const request = {
  subject: "Invoice question",
  category: "billing",
  message: "Can you add our VAT number to CAD-2026-0001?",
}

describe("support service", () => {
  it("opens a ticket with the first message and tells the team", async () => {
    const { service, notifications } = setup()

    const ticket = expectOk(await service.open(client, request))

    expect(ticket).toMatchObject({
      status: "open",
      subject: "Invoice question",
      lastReplyBy: "user",
    })
    expect(ticket.messages).toEqual([
      { authorId: "user-1", content: request.message, createdAt: NOW },
    ])
    expect(notifications).toEqual([{ kind: "team", ticket, from: client }])
  })

  it("validates the request", async () => {
    const { service } = setup()
    expect(
      await service.open(client, { ...request, message: "hi" })
    ).toMatchObject({ ok: false })
    expect(
      await service.open(client, { ...request, category: "nonsense" })
    ).toMatchObject({ ok: false })
  })

  it("only shows clients their own tickets", async () => {
    const { service } = setup()
    const ticket = expectOk(await service.open(client, request))

    expect(await service.getForUser(otherClient.id, ticket.id)).toBeNull()
    expect((await service.getForUser(client.id, ticket.id))?.id).toBe(ticket.id)
    expect(await service.listForUser(otherClient.id)).toEqual([])
  })

  it("refuses replies from other clients", async () => {
    const { service } = setup()
    const ticket = expectOk(await service.open(client, request))
    expect(
      await service.reply(otherClient, ticket.id, "Let me in", "user")
    ).toEqual({
      ok: false,
      error: "Ticket not found",
    })
  })

  it("moves a ticket in progress when the team replies and emails the client", async () => {
    const { service, notifications } = setup()
    const ticket = expectOk(await service.open(client, request))

    const replied = expectOk(
      await service.reply(
        admin,
        ticket.id,
        "Done — updated invoice attached.",
        "admin"
      )
    )

    expect(replied.status).toBe("in-progress")
    expect(replied.lastReplyBy).toBe("admin")
    expect(notifications.at(-1)).toMatchObject({ kind: "client", from: admin })
  })

  it("reopens a resolved ticket when the client replies", async () => {
    const { service } = setup()
    const ticket = expectOk(await service.open(client, request))
    expectOk(await service.setStatus(ticket.id, "resolved"))

    const reopened = expectOk(
      await service.reply(client, ticket.id, "One more thing, please.", "user")
    )

    expect(reopened.status).toBe("open")
  })

  it("does not accept replies on closed tickets", async () => {
    const { service } = setup()
    const ticket = expectOk(await service.open(client, request))
    expectOk(await service.setStatus(ticket.id, "closed"))
    expect(
      await service.reply(client, ticket.id, "Hello again there", "user")
    ).toMatchObject({ ok: false })
  })
})
