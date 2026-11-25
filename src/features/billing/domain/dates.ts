export const DAY_MS = 86_400_000

export const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS)

export const startOfUtcDay = (date: Date) =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )

export const isoDay = (date: Date) => date.toISOString().slice(0, 10)
