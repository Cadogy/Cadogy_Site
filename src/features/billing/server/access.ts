import "server-only"

import { createHash, randomBytes } from "node:crypto"
import { model, models, Schema, type Model, type Types } from "mongoose"

import { env } from "@/env"
import { sendAccessApproved, sendAccessRequest } from "@/lib/email"
import { connectToDatabase } from "@/lib/mongodb"

import {
  createAccessRequests,
  type AccessRequest,
  type AccessRequestRepository,
} from "../application/access-requests"
import { billing } from "./billing"

type AccessRequestDoc = Omit<AccessRequest, "id"> & { _id: Types.ObjectId }

const accessRequestSchema = new Schema<AccessRequestDoc>(
  {
    clientId: { type: String, required: true, index: true },
    invoiceId: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    name: { type: String, default: "" },
    tokenHash: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["pending", "approved", "declined"],
      required: true,
    },
    createdAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    decidedAt: { type: Date, default: null },
  },
  { versionKey: false }
)

const AccessRequestModel: Model<AccessRequestDoc> =
  models.AccessRequest ??
  model<AccessRequestDoc>(
    "AccessRequest",
    accessRequestSchema,
    "billing_access_requests"
  )

const toRequest = ({ _id, ...rest }: AccessRequestDoc): AccessRequest => ({
  ...rest,
  id: _id.toString(),
})

const withDb =
  <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
  async (...args: Args) => {
    await connectToDatabase()
    return fn(...args)
  }

const repository: AccessRequestRepository = {
  insert: withDb(async (request) =>
    toRequest((await AccessRequestModel.create(request)).toObject())
  ),
  save: withDb(async (request) => {
    const { id, ...fields } = request
    await AccessRequestModel.replaceOne({ _id: id }, fields)
    return request
  }),
  findPending: withDb(async (clientId, email, now) => {
    const doc = await AccessRequestModel.findOne({
      clientId,
      email,
      status: "pending",
      expiresAt: { $gt: now },
    }).lean<AccessRequestDoc>()
    return doc ? toRequest(doc) : null
  }),
  findByTokenHash: withDb(async (tokenHash) => {
    const doc = await AccessRequestModel.findOne({
      tokenHash,
    }).lean<AccessRequestDoc>()
    return doc ? toRequest(doc) : null
  }),
}

export const accessRequests = createAccessRequests({
  billing,
  repository,
  clock: () => new Date(),
  randomToken: () => randomBytes(32).toString("base64url"),
  hash: (token) => createHash("sha256").update(token).digest("hex"),
  baseUrl: env.NEXT_PUBLIC_APP_URL,
  notify: {
    requested: (to, details) => sendAccessRequest(to, details),
    approved: (to, { company }) => sendAccessApproved(to, company),
  },
})
