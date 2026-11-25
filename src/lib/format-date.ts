const dateTimeUtc = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

const dayUtc = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export const formatDateTimeUtc = (date: Date) =>
  `${dateTimeUtc.format(date)} UTC`

export const formatDayUtc = (date: Date) => dayUtc.format(date)
