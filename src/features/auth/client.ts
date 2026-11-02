import { adminClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { TURNSTILE_HEADER } from "./domain/http"

export const authClient = createAuthClient({ plugins: [adminClient()] })

export const humanCheckHeaders = (turnstileToken: string) => ({
  [TURNSTILE_HEADER]: turnstileToken,
})
