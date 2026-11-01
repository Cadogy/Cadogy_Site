import "server-only"

import { Resend } from "resend"

import { env } from "@/env"

import { emailButton, emailLayout, escapeHtml } from "./email/html"

type OutgoingEmail = {
  readonly to: string | readonly string[]
  readonly subject: string
  readonly html: string
  readonly text: string
  readonly replyTo?: string
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export const sendEmail = async (email: OutgoingEmail) => {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY missing; skipped "${email.subject}"`)
    return
  }
  const { error } = await resend.emails.send({
    from: env.FROM_EMAIL,
    to: typeof email.to === "string" ? [email.to] : [...email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: email.replyTo ?? "hello@cadogy.com",
  })
  if (error)
    throw new Error(`Resend rejected "${email.subject}": ${error.message}`)
}

type ActionEmail = {
  readonly to: string
  readonly subject: string
  readonly intro: string
  readonly url: string
  readonly cta: string
  readonly outro: string
}

const sendActionEmail = ({
  to,
  subject,
  intro,
  url,
  cta,
  outro,
}: ActionEmail) =>
  sendEmail({
    to,
    subject,
    html: emailLayout({
      baseUrl: env.NEXT_PUBLIC_APP_URL,
      preheader: intro,
      body: `<p style="margin:0 0 16px;">${escapeHtml(intro)}</p>${emailButton(url, cta)}<p style="margin:0;color:#71717a;font-size:13px;">${escapeHtml(outro)}</p>`,
    }),
    text: `${intro}\n\n${cta}: ${url}\n\n${outro}`,
  })

export const sendVerificationEmail = (email: string, token: string) =>
  sendActionEmail({
    to: email,
    subject: "Verify your email address",
    intro:
      "Confirm your email address to finish setting up your Cadogy client account.",
    url: `${env.NEXT_PUBLIC_APP_URL}/verify-email?token=${encodeURIComponent(token)}`,
    cta: "Verify email",
    outro: "If you didn't create an account, you can ignore this email.",
  })

export const sendPasswordResetEmail = (email: string, token: string) =>
  sendActionEmail({
    to: email,
    subject: "Reset your password",
    intro:
      "We received a request to reset the password for your Cadogy account. This link expires in one hour.",
    url: `${env.NEXT_PUBLIC_APP_URL}/reset-password?token=${encodeURIComponent(token)}`,
    cta: "Reset password",
    outro:
      "If you didn't request this, you can ignore this email. Your password won't change.",
  })
