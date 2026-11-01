import {
  inquiryInputSchema,
  spamFieldsSchema,
  type Inquiry,
} from "../domain/schema"
import { checkFormTiming, looksLikeSpam } from "../domain/spam"

const IP_LIMIT_PER_HOUR = 3
const EMAIL_LIMIT_PER_DAY = 5
const HOUR_MS = 60 * 60 * 1000

export type InquiryDependencies = {
  readonly clock: () => Date
  readonly formSecret: string
  readonly verifyTurnstile: (token: string, ip: string) => Promise<boolean>
  readonly rateLimiter: {
    readonly hit: (key: string, windowMs: number) => Promise<number>
  }
  readonly store: { readonly save: (inquiry: Inquiry) => Promise<void> }
  readonly notifyAdmin: (inquiry: Inquiry) => Promise<void>
}

export type SubmissionContext = {
  readonly ip: string
  readonly userAgent: string
}

export type SubmissionResult =
  | { readonly status: "accepted" }
  | { readonly status: "invalid"; readonly fieldErrors: Record<string, string> }
  | { readonly status: "expired" }
  | { readonly status: "verification_failed" }
  | { readonly status: "rate_limited" }

const ACCEPTED: SubmissionResult = { status: "accepted" }

const fieldErrorsOf = (
  issues: readonly { path: PropertyKey[]; message: string }[]
) =>
  Object.fromEntries(
    issues
      .filter((issue) => issue.path.length > 0)
      .map((issue) => [String(issue.path[0]), issue.message])
      .reverse()
  )

export const createInquiryService = (deps: InquiryDependencies) => {
  const isRateLimited = async (ip: string, email: string) => {
    const [byIp, byEmail] = await Promise.all([
      deps.rateLimiter.hit(`inquiry:ip:${ip}`, HOUR_MS),
      deps.rateLimiter.hit(`inquiry:email:${email}`, 24 * HOUR_MS),
    ])
    return byIp > IP_LIMIT_PER_HOUR || byEmail > EMAIL_LIMIT_PER_DAY
  }

  const submit = async (
    raw: unknown,
    context: SubmissionContext
  ): Promise<SubmissionResult> => {
    const parsed = inquiryInputSchema.safeParse(raw)
    if (!parsed.success)
      return {
        status: "invalid",
        fieldErrors: fieldErrorsOf(parsed.error.issues),
      }
    const spam = spamFieldsSchema.parse(raw)

    if (spam.website.trim() !== "") return ACCEPTED
    const timing = checkFormTiming(
      spam.formToken,
      deps.clock(),
      deps.formSecret
    )
    if (timing === "expired") return { status: "expired" }
    if (timing !== "ok") return ACCEPTED
    if (looksLikeSpam(parsed.data.message)) return ACCEPTED

    if (await isRateLimited(context.ip, parsed.data.email))
      return { status: "rate_limited" }
    if (!(await deps.verifyTurnstile(spam.turnstileToken, context.ip)))
      return { status: "verification_failed" }

    const inquiry: Inquiry = {
      ...parsed.data,
      status: "new",
      ip: context.ip,
      userAgent: context.userAgent.slice(0, 300),
      createdAt: deps.clock(),
    }
    await deps.store.save(inquiry)

    try {
      await deps.notifyAdmin(inquiry)
    } catch (error) {
      console.error("Inquiry stored but admin notification failed", error)
    }
    return ACCEPTED
  }

  return { submit }
}
