import "server-only"

import { findUserContact } from "@/features/auth/server/database"
import { Ticket, type TicketDoc } from "@/models/Ticket"
import { isValidObjectId } from "mongoose"

import { env } from "@/env"
import { sendEmail } from "@/lib/email"
import { emailButton, emailLayout, escapeHtml } from "@/lib/email/html"
import { connectToDatabase } from "@/lib/mongodb"

import {
  createSupportService,
  type SupportTicket,
  type TicketNotification,
} from "../application/support-service"

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

const withDb =
  <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
  async (...args: Args) => {
    await connectToDatabase()
    return fn(...args)
  }

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
  const intro = toTeam
    ? `${from.name || from.email} wrote:`
    : "The Cadogy team replied to your request:"

  await sendEmail({
    to: recipient,
    replyTo: toTeam ? from.email : undefined,
    subject,
    html: emailLayout({
      baseUrl: env.NEXT_PUBLIC_APP_URL,
      preheader: latest.slice(0, 120),
      body: `<p style="margin:0 0 12px;color:#71717a;">${escapeHtml(intro)}</p><p style="margin:0;white-space:pre-wrap;">${escapeHtml(latest)}</p>${emailButton(url, "View conversation")}`,
    }),
    text: `${intro}\n\n${latest}\n\nView conversation: ${url}`,
  })
}

export const support = createSupportService({
  clock: () => new Date(),
  store: {
    insert: withDb(async (ticket) =>
      toTicket((await Ticket.create(ticket)).toObject())
    ),
    save: withDb(async (ticket) => {
      const { id, ...fields } = ticket
      await Ticket.replaceOne({ _id: id }, fields)
      return ticket
    }),
    find: withDb(async (id) => {
      if (!isValidObjectId(id)) return null
      const doc = await Ticket.findById(id).lean<TicketDoc>()
      return doc ? toTicket(doc) : null
    }),
    list: withDb(async ({ userId, status }) => {
      const docs = await Ticket.find({
        ...(userId ? { userId } : {}),
        ...(status ? { status } : {}),
      })
        .sort({ lastReplyAt: -1 })
        .limit(200)
        .lean<TicketDoc[]>()
      return docs.map(toTicket)
    }),
  },
  notify,
})
