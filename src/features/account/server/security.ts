import "server-only"

import { headers } from "next/headers"
import { describeDevice, displayIp } from "@/features/auth/domain/devices"
import { securityEventLabel } from "@/features/auth/domain/security-events"
import { auth } from "@/features/auth/server/auth"
import { securityLog } from "@/features/auth/server/security-log"

import type { SavedPasskey } from "../components/passkey-settings"
import type { DeviceSession } from "../components/session-list"

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

const formatDateTime = (date: Date) => `${dateTime.format(date)} UTC`

export const mySessions = async (): Promise<DeviceSession[]> => {
  const requestHeaders = await headers()
  const [current, sessions] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    auth.api.listSessions({ headers: requestHeaders }),
  ])
  return [...sessions]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((session) => ({
      id: session.id,
      device: describeDevice(session.userAgent),
      ip: displayIp(session.ipAddress),
      lastActiveLabel: formatDateTime(session.updatedAt),
      current: session.id === current?.session.id,
    }))
}

export const myActivity = async (userId: string) =>
  (await securityLog.forUser(userId, 20)).map((event) => ({
    key: `${event.type}-${event.at.getTime()}`,
    label: securityEventLabel(event.type),
    device: event.userAgent ? describeDevice(event.userAgent) : "Automatic",
    ip: displayIp(event.ip),
    when: formatDateTime(event.at),
    warning: ["sign_in_failed", "two_factor_failed", "account_locked"].includes(
      event.type
    ),
  }))

const dateOnly = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

export const mySecondFactors = async () => {
  const requestHeaders = await headers()
  const [session, passkeys] = await Promise.all([
    auth.api.getSession({ headers: requestHeaders }),
    auth.api.listPasskeys({ headers: requestHeaders }),
  ])
  return {
    twoFactorEnabled: Boolean(session?.user.twoFactorEnabled),
    passkeys: passkeys.map((passkey): SavedPasskey => ({
      id: passkey.id,
      name: passkey.name || "Passkey",
      createdLabel: dateOnly.format(new Date(passkey.createdAt)),
    })),
  }
}
