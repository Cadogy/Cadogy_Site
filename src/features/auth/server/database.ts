import "server-only"

import { ObjectId } from "mongodb"

import { database } from "@/lib/mongodb"

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

export const users = () => database().collection<UserRecord>("user")

export const userObjectId = (id: string) =>
  ObjectId.isValid(id) ? new ObjectId(id) : null

export const findUserById = (id: string) => {
  const _id = userObjectId(id)
  return _id ? users().findOne({ _id }) : Promise.resolve(null)
}

export const countOwners = () => users().countDocuments({ role: "owner" })

export const findUserContact = async (id: string) => {
  const doc = await findUserById(id)
  return doc ? { email: doc.email, name: doc.name } : null
}
