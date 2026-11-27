import "server-only"

import { MongoClient } from "mongodb"
import mongoose from "mongoose"

import { env } from "@/env"

declare global {
  var mongoClient: MongoClient | undefined
  var mongooseReady: Promise<typeof mongoose> | undefined
}

/**
 * The app's one connection pool, created on first use. Auth talks to the
 * driver directly through `database()`; Mongoose models are handed the same
 * client, so a request never holds two pools to the same database.
 */
export const mongoClient = () =>
  (globalThis.mongoClient ??= new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  }))

export const database = () => mongoClient().db()

/** Transactions need a replica set: Atlas (+srv) or an explicit replicaSet. */
export const supportsTransactions = () =>
  /^mongodb\+srv:|replicaSet=/.test(env.MONGODB_URI)

const DUPLICATE_KEY = 11000

export const connectToDatabase = async () => {
  globalThis.mongooseReady ??= (async () => {
    const client = await mongoClient().connect()
    if (
      mongoose.connection.readyState === mongoose.ConnectionStates.disconnected
    )
      mongoose.connection.setClient(client)
    return mongoose
  })()
  try {
    return await globalThis.mongooseReady
  } catch (error) {
    globalThis.mongooseReady = undefined
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
