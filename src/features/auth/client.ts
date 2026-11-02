import { createAuthClient } from "better-auth/react"

import { TURNSTILE_HEADER } from "./domain/http"

export const authClient = createAuthClient()

export const humanCheckHeaders = (turnstileToken: string) => ({
  [TURNSTILE_HEADER]: turnstileToken,
})
