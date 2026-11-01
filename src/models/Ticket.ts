import {
  TICKET_CATEGORIES,
  TICKET_STATUSES,
  type SupportTicket,
} from "@/features/support/application/support-service"
import { model, models, Schema, type Model, type Types } from "mongoose"

export type TicketDoc = Omit<SupportTicket, "id"> & { _id: Types.ObjectId }

const messageSchema = new Schema(
  {
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
)

const ticketSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    category: {
      type: String,
      enum: TICKET_CATEGORIES.map((category) => category.value),
      default: "general",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: "open",
      index: true,
    },
    messages: [messageSchema],
    lastReplyAt: Date,
    lastReplyBy: { type: String, enum: ["user", "admin"] },
  },
  { timestamps: true }
)

export const Ticket: Model<TicketDoc> =
  models.Ticket ?? model<TicketDoc>("Ticket", ticketSchema)
