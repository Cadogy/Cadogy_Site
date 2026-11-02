import { passkeyClient } from "@better-auth/passkey/client"
import {
  adminClient,
  magicLinkClient,
  twoFactorClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

import { TURNSTILE_HEADER } from "./domain/http"

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    twoFactorClient(),
    passkeyClient(),
    magicLinkClient(),
  ],
})

export const humanCheckHeaders = (turnstileToken: string) => ({
  [TURNSTILE_HEADER]: turnstileToken,
})
