import "server-only"

import { sendSecurityNotice } from "@/lib/email"

import type { AccountNotice } from "../application/user-admin-service"
import type { SecurityEventType } from "../domain/security-events"

type Notice = { readonly subject: string; readonly intro: string }

const EVENT_NOTICES: Partial<Record<SecurityEventType, Notice>> = {
  password_changed: {
    subject: "Your Cadogy password was changed",
    intro:
      "The password on your Cadogy account was just changed, and your other devices were signed out.",
  },
  password_reset: {
    subject: "Your Cadogy password was reset",
    intro:
      "The password on your Cadogy account was just reset, and every device was signed out.",
  },
  two_factor_disabled: {
    subject: "Two-factor authentication was turned off",
    intro:
      "Two-factor authentication was just turned off on your Cadogy account. Your account is now protected by your password alone.",
  },
  role_changed: {
    subject: "Your access to Cadogy changed",
    intro:
      "An owner changed your role on Cadogy. You've been signed out so the change takes effect. Sign in again to see what you can access.",
  },
  passkey_added: {
    subject: "A passkey was added to your account",
    intro: "A new passkey was just added to your Cadogy account.",
  },
}

const ACCOUNT_NOTICES: Record<AccountNotice, Notice> = {
  two_factor_reset: {
    subject: "Two-factor authentication was reset",
    intro:
      "The Cadogy team reset two-factor authentication on your account, usually because you asked for help signing in. You've been signed out everywhere.",
  },
  impersonated: {
    subject: "Our team viewed your client portal",
    intro:
      "A member of the Cadogy team opened your client portal as you, usually to help with a support request. They couldn't make payments or change your saved card.",
  },
}

const noticeForEvent = (type: SecurityEventType) =>
  EVENT_NOTICES[type] ?? null

export const sendEventNotice = async (to: string, type: SecurityEventType) => {
  const notice = noticeForEvent(type)
  if (notice) await sendSecurityNotice({ to, ...notice })
}

export const sendAccountNotice = (to: string, kind: AccountNotice) =>
  sendSecurityNotice({ to, ...ACCOUNT_NOTICES[kind] })

export const sendNewSignInAlert = (
  to: string,
  sighting: {
    readonly device: string
    readonly ip: string
    readonly when: string
  }
) =>
  sendSecurityNotice({
    to,
    subject: "New sign-in to your Cadogy account",
    intro: `Your account was just used to sign in from ${sighting.device}${sighting.ip ? ` (${sighting.ip})` : ""} on ${sighting.when}. We're letting you know because we haven't seen this device or network recently.`,
  })
