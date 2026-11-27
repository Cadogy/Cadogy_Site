import "server-only"

import { model, models, Schema, type Model, type Types } from "mongoose"

import {
  BUDGETS,
  INQUIRY_STATUSES,
  PROJECT_TYPES,
  TIMELINES,
  type Inquiry,
} from "../domain/schema"

export type InquiryDoc = Inquiry & { _id: Types.ObjectId }

const inquirySchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, index: true },
    company: { type: String, default: "" },
    projectType: {
      type: String,
      enum: PROJECT_TYPES.map((option) => option.value),
      required: true,
    },
    budget: {
      type: String,
      enum: ["", ...BUDGETS.map((option) => option.value)],
      default: "",
    },
    timeline: {
      type: String,
      enum: ["", ...TIMELINES.map((option) => option.value)],
      default: "",
    },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: INQUIRY_STATUSES,
      default: "new",
      index: true,
    },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    createdAt: { type: Date, required: true, index: true },
  },
  { versionKey: false }
)

export const InquiryModel: Model<InquiryDoc> =
  models.Inquiry ?? model<InquiryDoc>("Inquiry", inquirySchema)
