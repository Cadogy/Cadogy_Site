const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify"

type VerifierOptions = {
  readonly secret: string | undefined
  readonly environment: string | undefined
  readonly fetcher?: typeof fetch
}

export const createTurnstileVerifier =
  ({ secret, environment, fetcher = fetch }: VerifierOptions) =>
  async (token: string, ip: string): Promise<boolean> => {
    if (!secret) return environment === "development"
    if (!token) return false

    const body = new FormData()
    body.append("secret", secret)
    body.append("response", token)
    body.append("remoteip", ip)

    try {
      const response = await fetcher(SITEVERIFY_URL, { method: "POST", body })
      const outcome: unknown = await response.json()
      return (
        typeof outcome === "object" &&
        outcome !== null &&
        "success" in outcome &&
        outcome.success === true
      )
    } catch (error) {
      console.error("Turnstile verification failed", error)
      return false
    }
  }

export const verifyTurnstile = createTurnstileVerifier({
  secret: process.env.TURNSTILE_SECRET_KEY,
  environment: process.env.NODE_ENV,
})
