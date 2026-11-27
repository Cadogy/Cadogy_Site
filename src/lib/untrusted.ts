/**
 * Server actions and routes receive whatever the request contains, whatever
 * the TypeScript signature says: a "string" argument can arrive as an object
 * like {"$regex": "^a"} and turn a MongoDB lookup into a search. Check the
 * shape of untrusted values before they reach a query. For fixed choices,
 * use isOneOf from @/lib/is-one-of.
 */
export const isToken = (value: unknown, maxLength = 256): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= maxLength
