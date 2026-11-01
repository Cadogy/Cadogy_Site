"use server"

import { headers } from "next/headers"
import { User } from "@/models/User"

import { requireUser } from "@/lib/auth/session"
import { connectToDatabase } from "@/lib/mongodb"

import type { AccountResult } from "../application/account-service"
import { accounts } from "./account"

const requestIp = async () => {
  const requestHeaders = await headers()
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    ""
  )
}

type FormAction = (
  previous: AccountResult | null,
  formData: FormData
) => Promise<AccountResult>

export const registerAction: FormAction = async (_previous, formData) =>
  accounts.register(Object.fromEntries(formData), await requestIp())

export const requestPasswordResetAction: FormAction = async (
  _previous,
  formData
) =>
  accounts.requestPasswordReset(Object.fromEntries(formData), await requestIp())

export const resetPasswordAction: FormAction = async (_previous, formData) =>
  accounts.resetPassword(Object.fromEntries(formData))

export const verifyEmailAction: FormAction = async (_previous, formData) =>
  accounts.verifyEmail(String(formData.get("token") ?? ""))

export const resendVerificationAction = async (email: string) =>
  accounts.resendVerification({ email })

export const changePasswordAction: FormAction = async (_previous, formData) => {
  const user = await requireUser("/dashboard/settings")
  return accounts.changePassword(user.email, Object.fromEntries(formData))
}

export const updateNameAction: FormAction = async (_previous, formData) => {
  const user = await requireUser("/dashboard/settings")
  const name = String(formData.get("name") ?? "").trim()
  if (name.length > 120)
    return { ok: false, error: "Use at most 120 characters.", field: "name" }
  await connectToDatabase()
  await User.updateOne({ email: user.email }, { $set: { name } })
  return { ok: true }
}
