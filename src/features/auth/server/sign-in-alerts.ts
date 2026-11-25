import "server-only"

import { formatDateTimeUtc } from "@/lib/format-date"

import { describeDevice, displayIp } from "../domain/devices"
import { SIGN_IN_EVENTS } from "../domain/security-events"
import { isUnfamiliarSignIn, networkOf } from "../domain/sign-in-alerts"
import { authDb } from "./database"
import { sendNewSignInAlert } from "./notices"

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

export const alertIfUnfamiliar = async ({
  userId,
  email,
  ip,
  userAgent,
}: {
  readonly userId: string
  readonly email: string
  readonly ip: string
  readonly userAgent: string
}) => {
  const now = new Date()
  const history = await authDb
    .collection<{ ip: string; userAgent: string }>("security_events")
    .find({
      targetId: userId,
      type: { $in: SIGN_IN_EVENTS },
      at: { $gte: new Date(now.getTime() - NINETY_DAYS_MS) },
    })
    .project<{ ip: string; userAgent: string }>({ ip: 1, userAgent: 1 })
    .limit(500)
    .toArray()
  const device = describeDevice(userAgent)
  const unfamiliar = isUnfamiliarSignIn({
    device,
    network: networkOf(ip),
    history: history.map((event) => ({
      device: describeDevice(event.userAgent),
      network: networkOf(event.ip),
    })),
  })
  if (unfamiliar)
    await sendNewSignInAlert(email, {
      device,
      ip: displayIp(ip),
      when: formatDateTimeUtc(now),
    })
}
