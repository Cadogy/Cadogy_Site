import "server-only"

import { headers } from "next/headers"
import { describeDevice, displayIp } from "@/features/auth/domain/devices"
import {
  isFailureEvent,
  securityEventLabel,
} from "@/features/auth/domain/security-events"
import { auth } from "@/features/auth/server/auth"
import { securityLog } from "@/features/auth/server/security-log"

import { formatDateTimeUtc, formatDayUtc } from "@/lib/format-date"

import type { SavedPasskey } from "../components/passkey-settings"
import type { DeviceSession } from "../components/session-list"

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
      lastActiveLabel: formatDateTimeUtc(session.updatedAt),
      current: session.id === current?.session.id,
    }))
}

export const myActivity = async (userId: string) =>
  (await securityLog.forUser(userId, 20)).map((event) => ({
    key: `${event.type}-${event.at.getTime()}`,
    label: securityEventLabel(event.type),
    device: event.userAgent ? describeDevice(event.userAgent) : "Automatic",
    ip: displayIp(event.ip),
    when: formatDateTimeUtc(event.at),
    warning: isFailureEvent(event.type),
  }))

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
      createdLabel: formatDayUtc(new Date(passkey.createdAt)),
    })),
  }
}
