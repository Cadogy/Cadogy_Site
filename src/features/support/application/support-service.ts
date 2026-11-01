import { fail, ok, type Result } from "@/features/billing/domain/invoice"
import { z } from "zod"

export const TICKET_CATEGORIES = [
  { value: "general", label: "General question" },
  { value: "billing", label: "Billing or invoices" },
  { value: "technical", label: "Technical issue" },
  { value: "bug-report", label: "Bug report" },
  { value: "feature-request", label: "Change request" },
] as const

export const TICKET_STATUSES = [
  "open",
  "in-progress",
  "resolved",
  "closed",
] as const

type TicketCategory = (typeof TICKET_CATEGORIES)[number]["value"]
export type TicketStatus = (typeof TICKET_STATUSES)[number]

type TicketMessage = {
  readonly authorId: string
  readonly content: string
  readonly createdAt: Date
}

export type SupportTicket = {
  readonly id: string
  readonly userId: string
  readonly subject: string
  readonly category: TicketCategory
  readonly priority: "low" | "medium" | "high"
  readonly status: TicketStatus
  readonly messages: readonly TicketMessage[]
  readonly lastReplyAt: Date
  readonly lastReplyBy: "user" | "admin"
  readonly createdAt: Date
}

export type Participant = {
  readonly id: string
  readonly email: string
  readonly name: string
}

export type TicketNotification = {
  readonly kind: "team" | "client"
  readonly ticket: SupportTicket
  readonly from: Participant
}

type Dependencies = {
  readonly clock: () => Date
  readonly store: {
    readonly insert: (
      ticket: Omit<SupportTicket, "id">
    ) => Promise<SupportTicket>
    readonly save: (ticket: SupportTicket) => Promise<SupportTicket>
    readonly find: (id: string) => Promise<SupportTicket | null>
    readonly list: (filter: {
      userId?: string
      status?: TicketStatus
    }) => Promise<SupportTicket[]>
  }
  readonly notify: (notification: TicketNotification) => Promise<void>
}

const message = z
  .string()
  .trim()
  .min(10, "Please add a little more detail (at least 10 characters).")
  .max(10_000, "Please keep messages under 10,000 characters.")

const openSchema = z.object({
  subject: z.string().trim().min(3, "Add a short subject.").max(160),
  category: z.enum(
    TICKET_CATEGORIES.map((category) => category.value) as [
      TicketCategory,
      ...TicketCategory[],
    ],
    "Choose a category."
  ),
  message,
})

const firstIssue = (error: z.ZodError) =>
  error.issues[0]?.message ?? "Please check the form."

const newestFirst = (a: SupportTicket, b: SupportTicket) =>
  b.lastReplyAt.getTime() - a.lastReplyAt.getTime()

export const createSupportService = ({
  clock,
  store,
  notify,
}: Dependencies) => {
  const safeNotify = async (notification: TicketNotification) => {
    try {
      await notify(notification)
    } catch (error) {
      console.error("Ticket notification failed", error)
    }
  }

  const open = async (
    user: Participant,
    raw: unknown
  ): Promise<Result<SupportTicket>> => {
    const parsed = openSchema.safeParse(raw)
    if (!parsed.success) return fail(firstIssue(parsed.error))
    const now = clock()
    const ticket = await store.insert({
      userId: user.id,
      subject: parsed.data.subject,
      category: parsed.data.category,
      priority: "medium",
      status: "open",
      messages: [
        { authorId: user.id, content: parsed.data.message, createdAt: now },
      ],
      lastReplyAt: now,
      lastReplyBy: "user",
      createdAt: now,
    })
    await safeNotify({ kind: "team", ticket, from: user })
    return ok(ticket)
  }

  const getForUser = async (userId: string, id: string) => {
    const ticket = await store.find(id)
    return ticket?.userId === userId ? ticket : null
  }

  const reply = async (
    author: Participant,
    id: string,
    content: string,
    as: "user" | "admin"
  ): Promise<Result<SupportTicket>> => {
    const ticket =
      as === "admin" ? await store.find(id) : await getForUser(author.id, id)
    if (!ticket) return fail("Ticket not found")
    if (ticket.status === "closed")
      return fail("This ticket is closed. Please open a new one.")
    const parsed = message.safeParse(content)
    if (!parsed.success) return fail(firstIssue(parsed.error))

    const now = clock()
    const saved = await store.save({
      ...ticket,
      status:
        as === "admin"
          ? ticket.status === "open"
            ? "in-progress"
            : ticket.status
          : "open",
      messages: [
        ...ticket.messages,
        { authorId: author.id, content: parsed.data, createdAt: now },
      ],
      lastReplyAt: now,
      lastReplyBy: as,
    })
    await safeNotify({
      kind: as === "admin" ? "client" : "team",
      ticket: saved,
      from: author,
    })
    return ok(saved)
  }

  const setStatus = async (
    id: string,
    status: TicketStatus
  ): Promise<Result<SupportTicket>> => {
    const ticket = await store.find(id)
    if (!ticket) return fail("Ticket not found")
    return ok(await store.save({ ...ticket, status }))
  }

  return {
    open,
    reply,
    setStatus,
    getForUser,
    get: store.find,
    listForUser: async (userId: string) =>
      (await store.list({ userId })).sort(newestFirst),
    listAll: async (status?: TicketStatus) =>
      (await store.list({ status })).sort(newestFirst),
  }
}
