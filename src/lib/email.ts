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

export const sendVerificationEmail = (email: string, url: string) =>
  sendActionEmail({
    to: email,
    subject: "Verify your email address",
    intro:
      "Confirm your email address to finish setting up your Cadogy account. This link expires in 24 hours.",
    url,
    cta: "Verify email",
    outro: "If you didn't create an account, you can ignore this email.",
  })

export const sendPasswordResetEmail = (email: string, url: string) =>
  sendActionEmail({
    to: email,
    subject: "Reset your password",
    intro:
      "We received a request to reset the password for your Cadogy account. This link expires in one hour.",
    url,
    cta: "Reset password",
    outro:
      "If you didn't request this, you can ignore this email. Your password won't change.",
  })

export const sendExistingAccountNotice = (email: string) =>
  sendActionEmail({
    to: email,
    subject: "Someone tried to create an account with your email",
    intro:
      "Someone just tried to register a Cadogy account with this email address. You already have an account, so nothing was created.",
    url: `${env.NEXT_PUBLIC_APP_URL}/login`,
    cta: "Sign in",
    outro:
      "If this was you, sign in or reset your password from the sign-in page. If it wasn't, you can ignore this email.",
  })

export const sendAccountLockedNotice = (email: string) =>
  sendActionEmail({
    to: email,
    subject: "We paused password sign-in on your account",
    intro:
      "There were 10 failed attempts to sign in to your Cadogy account with a password in the last 15 minutes, so we've paused password sign-in for 15 minutes.",
    url: `${env.NEXT_PUBLIC_APP_URL}/forgot-password`,
    cta: "Reset your password",
    outro:
      "If this was you, wait 15 minutes and try again, or sign in with a passkey. If it wasn't, reset your password now.",
  })

export const sendMagicLinkEmail = (email: string, url: string) =>
  sendActionEmail({
    to: email,
    subject: "Your Cadogy sign-in link",
    intro:
      "Use the button below to sign in to your Cadogy account. The link works once and expires in 15 minutes.",
    url,
    cta: "Sign in",
    outro:
      "If you didn't ask for this, you can ignore this email. No one can sign in without the link.",
  })
