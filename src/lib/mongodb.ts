import "server-only"

import mongoose from "mongoose"

import { env } from "@/env"

declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined
}

const DUPLICATE_KEY = 11000

export const connectToDatabase = async () => {
  globalThis.mongooseConnection ??= mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  })
  try {
    return await globalThis.mongooseConnection
  } catch (error) {
    globalThis.mongooseConnection = undefined
    throw error
  }
}

export const withDatabase =
  <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
  async (...args: Args): Promise<R> => {
    await connectToDatabase()
    return fn(...args)
  }

export const isDuplicateKeyError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === DUPLICATE_KEY

export const withoutId = <T extends { id: string }>({ id: _id, ...rest }: T) =>
  rest

/** A lean Mongo document as a domain object: `_id` becomes a string `id`. */
export const withId = <T extends { _id: { toString(): string } }>({
  _id,
  ...rest
}: T) => ({ ...rest, id: _id.toString() })
