import "server-only"

import { findUserContact } from "@/features/auth/server/database"
import { Ticket, type TicketDoc } from "@/models/Ticket"
import { isValidObjectId } from "mongoose"

import { env } from "@/env"
import { sendEmail } from "@/lib/email"
import { renderEmail } from "@/lib/email/render"
import { withDatabase } from "@/lib/mongodb"

import {
  ACTIVE_STATUSES,
  createSupportService,
  type SupportTicket,
  type TicketNotification,
} from "../application/support-service"
import { SupportEmail } from "../email/support-email"

const toTicket = (doc: TicketDoc): SupportTicket => ({
  id: doc._id.toString(),
  userId: doc.userId,
  subject: doc.subject,
  category: doc.category,
  priority: doc.priority,
  status: doc.status,
  messages: doc.messages.map((message) => ({
    authorId: message.authorId,
    content: message.content,
    createdAt: message.createdAt,
  })),
  lastReplyAt: doc.lastReplyAt ?? doc.createdAt,
  lastReplyBy: doc.lastReplyBy ?? "user",
  createdAt: doc.createdAt,
})

const notify = async ({ kind, ticket, from }: TicketNotification) => {
  const latest = ticket.messages.at(-1)?.content ?? ""
  const toTeam = kind === "team"
  const recipient = toTeam
    ? env.ADMIN_NOTIFY_EMAIL
    : (await findUserContact(ticket.userId))?.email
  if (!recipient) return

  const path = toTeam
    ? `/admin/tickets/${ticket.id}`
    : `/dashboard/tickets/${ticket.id}`
  const url = `${env.NEXT_PUBLIC_APP_URL}${path}`
  const subject = toTeam
    ? `Support: ${ticket.subject} (${from.email})`
    : `Re: ${ticket.subject}`
  const body = await renderEmail(
    <SupportEmail
      baseUrl={env.NEXT_PUBLIC_APP_URL}
      audience={toTeam ? "team" : "client"}
      subject={ticket.subject}
      author={toTeam ? from.name || from.email : "The Cadogy team"}
      message={latest}
      url={url}
    />
  )
  // Every message about one request shares a thread in the inbox.
  const thread = `<ticket-${ticket.id}@cadogy.com>`

  await sendEmail({
    to: recipient,
    replyTo: toTeam ? from.email : undefined,
    subject,
    ...body,
    headers: { "In-Reply-To": thread, References: thread },
  })
}

export const support = createSupportService({
  clock: () => new Date(),
  store: {
    insert: withDatabase(async (ticket) =>
      toTicket((await Ticket.create(ticket)).toObject())
    ),
    save: withDatabase(async (ticket) => {
      const { id, ...fields } = ticket
      await Ticket.replaceOne({ _id: id }, fields)
      return ticket
    }),
    find: withDatabase(async (id) => {
      if (!isValidObjectId(id)) return null
      const doc = await Ticket.findById(id).lean<TicketDoc>()
      return doc ? toTicket(doc) : null
    }),
    list: withDatabase(async ({ userId, status }) => {
      const docs = await Ticket.find({
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      })
        .sort({ lastReplyAt: -1 })
        .limit(200)
        .lean<TicketDoc[]>()
      return docs.map(toTicket)
    }),
    // A count query: the sidebar badge doesn't need the tickets themselves.
    countAwaitingStaff: withDatabase(() =>
      Ticket.countDocuments({
        lastReplyBy: "user",
        status: { $in: ACTIVE_STATUSES },
      })
    ),
  },
  notify,
})
