"use server"

import { revalidatePath } from "next/cache"
import { User } from "@/models/User"
import { isValidObjectId } from "mongoose"

import { requireAdmin } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/mongodb"

export type ManagedUser = {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: "user" | "admin"
  readonly verified: boolean
  readonly createdAt: Date
}

export async function listUsers(): Promise<ManagedUser[]> {
  await requireAdmin()
  await connectToDatabase()
  const users = await User.find({}, { password: 0 })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean()
  return users.map((user) => ({
    id: user._id.toString(),
    email: user.email,
    name: user.name ?? "",
    role: user.role,
    verified: Boolean(user.emailVerified),
    createdAt: user.createdAt,
  }))
}

export async function setUserRoleAction(
  userId: string,
  role: "user" | "admin"
) {
  const admin = await requireAdmin()
  if (!isValidObjectId(userId) || userId === admin.id) return
  await connectToDatabase()
  await User.updateOne({ _id: userId }, { $set: { role } })
  revalidatePath("/admin/users")
}
