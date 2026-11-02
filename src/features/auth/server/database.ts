import "server-only"

import { MongoClient, ObjectId } from "mongodb"

import { env } from "@/env"

declare global {
  var authMongoClient: MongoClient | undefined
}

export const authMongoClient = (globalThis.authMongoClient ??= new MongoClient(
  env.MONGODB_URI,
  { serverSelectionTimeoutMS: 10_000 }
))

export const authDb = authMongoClient.db()

export const supportsTransactions = /^mongodb\+srv:|replicaSet=/.test(
  env.MONGODB_URI
)

type UserRecord = {
  readonly _id: ObjectId
  readonly email: string
  readonly name: string
  readonly role?: string
  readonly emailVerified: boolean
  readonly banned?: boolean
  readonly banReason?: string
  readonly twoFactorEnabled?: boolean
  readonly createdAt: Date
}

export const users = () => authDb.collection<UserRecord>("user")

export const userObjectId = (id: string) =>
  ObjectId.isValid(id) ? new ObjectId(id) : null

export const findUserContact = async (id: string) => {
  const _id = userObjectId(id)
  const doc = _id ? await users().findOne({ _id }) : null
  return doc ? { email: doc.email, name: doc.name } : null
}
