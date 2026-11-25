export const clientContext = (headers: Headers | undefined) => ({
  ip:
    headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers?.get("x-real-ip") ||
    "",
  userAgent: headers?.get("user-agent") ?? "",
})
