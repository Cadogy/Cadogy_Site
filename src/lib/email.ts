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

const securityUrl = () => `${env.NEXT_PUBLIC_APP_URL}/account/security`

export const sendSecurityNotice = ({
  to,
  subject,
  intro,
}: {
  readonly to: string
  readonly subject: string
  readonly intro: string
}) =>
  sendActionEmail({
    to,
    subject,
    intro,
    url: securityUrl(),
    cta: "Review your security settings",
    outro:
      "If this wasn't you, reset your password and sign out of other devices right away, then reply to this email so we can help.",
  })

export const sendEmailChangeConfirmation = (
  email: string,
  newEmail: string,
  url: string
) =>
  sendActionEmail({
    to: email,
    subject: "Confirm your new email address",
    intro: `Someone asked to change the email on your Cadogy account to ${newEmail}. Confirm below and we'll send a verification link to the new address.`,
    url,
    cta: "Confirm the change",
    outro:
      "If you didn't ask for this, ignore this email and your address stays the same. Then change your password.",
  })

export const sendDeleteAccountConfirmation = (email: string, url: string) =>
  sendActionEmail({
    to: email,
    subject: "Confirm deleting your Cadogy account",
    intro:
      "You asked to delete your Cadogy account. This signs you out everywhere and removes your login. Your paid invoices stay on record, as the law requires.",
    url,
    cta: "Delete my account",
    outro:
      "If you didn't ask for this, ignore this email and change your password.",
  })

export const sendTeamInvite = (
  email: string,
  details: { readonly company: string; readonly role: "billing" | "viewer" }
) =>
  sendActionEmail({
    to: email,
    subject: `You now have access to ${details.company} on Cadogy`,
    intro:
      details.role === "billing"
        ? `You've been added to ${details.company}'s Cadogy account as a billing contact. You'll receive invoices and can pay them, manage saved cards and invite your team.`
        : `You've been added to ${details.company}'s Cadogy account. You can see invoices, statements and support requests.`,
    url: `${env.NEXT_PUBLIC_APP_URL}/register`,
    cta: "Sign in or create your account",
    outro: `Use this email address (${email}) so everything appears automatically.`,
  })

export const sendAccessRequest = (
  to: readonly string[],
  details: {
    readonly requester: string
    readonly company: string
    readonly invoiceNumber: string
    readonly approveUrl: string
  }
) =>
  sendEmail({
    to,
    subject: `${details.requester} asked to see ${details.company}'s invoices`,
    html: emailLayout({
      baseUrl: env.NEXT_PUBLIC_APP_URL,
      preheader: `${details.requester} wants access to your Cadogy account.`,
      body: `<p style="margin:0 0 16px;">${escapeHtml(`${details.requester} opened invoice ${details.invoiceNumber} and asked to add it to their Cadogy account. Approving lets them see ${details.company}'s invoices, statements and support requests as a viewer.`)}</p>${emailButton(details.approveUrl, "Review the request")}<p style="margin:0;color:#71717a;font-size:13px;">${escapeHtml("If you don't recognize this person, decline the request. The link expires in 7 days.")}</p>`,
    }),
    text: `${details.requester} asked to see ${details.company}'s invoices on Cadogy.\n\nReview the request: ${details.approveUrl}\n\nIf you don't recognize this person, decline it. The link expires in 7 days.`,
  })

export const sendAccessApproved = (email: string, company: string) =>
  sendActionEmail({
    to: email,
    subject: `You now have access to ${company} on Cadogy`,
    intro: `Your request was approved. ${company}'s invoices now appear in your Cadogy dashboard.`,
    url: `${env.NEXT_PUBLIC_APP_URL}/dashboard/billing`,
    cta: "Open your dashboard",
    outro: "Questions? Just reply to this email.",
  })
