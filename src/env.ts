import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    MONGODB_URI: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url().optional(),
    OWNER_EMAIL: z.email().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    FROM_EMAIL: z.string().min(1).default("Cadogy <hello@cadogy.com>"),
    ADMIN_NOTIFY_EMAIL: z.email().default("hello@cadogy.com"),
    TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    CRON_SECRET: z.string().min(32).optional(),
    FORM_SIGNING_SECRET: z.string().min(32).optional(),
    GOOGLE_SITE_VERIFICATION: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_WP_API_URL: z
      .url()
      .default("https://wp.cadogy.com/wp-json/wp/v2"),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_WP_API_URL: process.env.NEXT_PUBLIC_WP_API_URL,
  },
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
  emptyStringAsUndefined: true,
})
