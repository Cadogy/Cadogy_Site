import { z } from "zod"

export const PROJECT_TYPES = [
  { value: "new-product", label: "A new product" },
  { value: "existing-product", label: "Improving an existing product" },
  { value: "payments", label: "Payments or commerce" },
  { value: "ai", label: "AI features or automation" },
  { value: "infrastructure", label: "Infrastructure or security" },
  { value: "advisory", label: "Technical advice or an audit" },
  { value: "other", label: "Something else" },
] as const

export const BUDGETS = [
  { value: "under-10k", label: "Under $10k" },
  { value: "10k-25k", label: "$10k–$25k" },
  { value: "25k-50k", label: "$25k–$50k" },
  { value: "50k-plus", label: "$50k+" },
  { value: "unsure", label: "Not sure yet" },
] as const

export const TIMELINES = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3-months", label: "In the next 1–3 months" },
  { value: "3-plus-months", label: "In 3+ months" },
  { value: "exploring", label: "Just exploring" },
] as const

const values = <T extends readonly { value: string }[]>(options: T) =>
  options.map((option) => option.value) as [
    T[number]["value"],
    ...T[number]["value"][],
  ]

const optionalChoice = <T extends readonly { value: string }[]>(options: T) =>
  z.union([z.enum(values(options)), z.literal("")]).default("")

export const inquiryInputSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please enter a valid email address.")),
  company: z.string().trim().max(160).default(""),
  projectType: z.enum(
    values(PROJECT_TYPES),
    "Please choose what you need help with."
  ),
  budget: optionalChoice(BUDGETS),
  timeline: optionalChoice(TIMELINES),
  message: z
    .string()
    .trim()
    .min(20, "Please tell us a little more (at least 20 characters).")
    .max(5000, "Please keep your message under 5,000 characters."),
})

export const spamFieldsSchema = z.object({
  website: z.string().default(""),
  formToken: z.string().default(""),
  turnstileToken: z.string().default(""),
})

type InquiryInput = z.infer<typeof inquiryInputSchema>

export const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "won",
  "lost",
  "spam",
] as const
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number]

export type Inquiry = InquiryInput & {
  readonly status: InquiryStatus
  readonly ip: string
  readonly userAgent: string
  readonly createdAt: Date
}

export const labelFor = (
  options: readonly { value: string; label: string }[],
  value: string
) => options.find((option) => option.value === value)?.label ?? "—"
