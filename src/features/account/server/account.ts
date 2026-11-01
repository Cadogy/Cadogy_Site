import "server-only"

import { randomBytes } from "node:crypto"
import { User } from "@/models/User"
import { model, models, Schema, type Model } from "mongoose"

import { hashPassword, verifyPassword } from "@/lib/auth"
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email"
import { connectToDatabase } from "@/lib/mongodb"
import { verifyTurnstile } from "@/lib/security/turnstile"

import {
  createAccountService,
  type StoredToken,
} from "../application/account-service"

const accountTokenSchema = new Schema<StoredToken>(
  {
    purpose: {
      type: String,
      enum: ["verify-email", "reset-password"],
      required: true,
    },
    email: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { versionKey: false }
)

const AccountTokenModel: Model<StoredToken> =
  models.AccountToken ??
  model<StoredToken>("AccountToken", accountTokenSchema, "account_tokens")

const withDb =
  <Args extends unknown[], R>(fn: (...args: Args) => Promise<R>) =>
  async (...args: Args) => {
    await connectToDatabase()
    return fn(...args)
  }

export const accounts = createAccountService({
  clock: () => new Date(),
  randomToken: () => randomBytes(32).toString("base64url"),
  verifyTurnstile,
  hashPassword,
  verifyPassword,
  users: {
    findByEmail: withDb(async (email) => {
      const user = await User.findOne({ email }).lean()
      return user
        ? {
            email: user.email,
            emailVerified: user.emailVerified ?? null,
            passwordHash: user.password ?? null,
          }
        : null
    }),
    create: withDb(async (email, passwordHash) => {
      await User.create({
        email,
        password: passwordHash,
        role: "user",
        emailVerified: null,
      })
    }),
    markVerified: withDb(async (email, at) => {
      await User.updateOne(
        { email, emailVerified: null },
        { $set: { emailVerified: at } }
      )
    }),
    setPassword: withDb(async (email, passwordHash) => {
      await User.updateOne({ email }, { $set: { password: passwordHash } })
    }),
  },
  tokens: {
    save: withDb(async (token) => {
      await AccountTokenModel.create(token)
    }),
    consume: withDb(async (purpose, tokenHash, now) =>
      AccountTokenModel.findOneAndDelete({
        purpose,
        tokenHash,
        expiresAt: { $gt: now },
      }).lean()
    ),
    deleteFor: withDb(async (purpose, email) => {
      await AccountTokenModel.deleteMany({ purpose, email })
    }),
  },
  mailer: {
    sendVerification: sendVerificationEmail,
    sendPasswordReset: sendPasswordResetEmail,
  },
})
