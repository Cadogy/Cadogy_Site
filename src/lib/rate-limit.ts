import "server-only"

import { model, models, Schema, type Model } from "mongoose"

import { connectToDatabase } from "@/lib/mongodb"

type RateLimitDoc = { _id: string; count: number; expiresAt: Date }

const rateLimitSchema = new Schema(
  {
    _id: { type: String, required: true },
    count: { type: Number, required: true },
    // MongoDB deletes each window's counter once it has passed.
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false }
)

const RateLimitModel: Model<RateLimitDoc> =
  models.RateLimit ??
  model<RateLimitDoc>("RateLimit", rateLimitSchema, "rate_limits")

/** Counts a hit for `key` in the current fixed window and returns the count. */
export const hitRateLimit = async (key: string, windowMs: number) => {
  await connectToDatabase()
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs
  const bucket = await RateLimitModel.findOneAndUpdate(
    { _id: `${key}:${windowStart}` },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date(windowStart + windowMs) },
    },
    { upsert: true, new: true }
  ).lean()
  return bucket?.count ?? 1
}

/** True while `key` has been hit at most `max` times in the window. */
export const withinRateLimit = async (
  key: string,
  max: number,
  windowMs: number
) => (await hitRateLimit(key, windowMs)) <= max

export const TOO_MANY_REQUESTS =
  "You're doing that a lot. Please wait a few minutes and try again."
