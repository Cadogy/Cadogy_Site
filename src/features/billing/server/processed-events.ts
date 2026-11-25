import "server-only"

import { isDuplicateKeyError, withDatabase } from "@/lib/mongodb"

import { ProcessedStripeEventModel } from "./models"

export const claimEvent = withDatabase(async (eventId: string) => {
  try {
    await ProcessedStripeEventModel.create({ _id: eventId })
    return true
  } catch (error) {
    if (isDuplicateKeyError(error)) return false
    throw error
  }
})

export const releaseEvent = withDatabase(async (eventId: string) => {
  await ProcessedStripeEventModel.deleteOne({ _id: eventId })
})
