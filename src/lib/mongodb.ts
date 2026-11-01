import "server-only"

import mongoose from "mongoose"

declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined
}

export const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI is not configured")

  globalThis.mongooseConnection ??= mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  })
  try {
    return await globalThis.mongooseConnection
  } catch (error) {
    globalThis.mongooseConnection = undefined
    throw error
  }
}
