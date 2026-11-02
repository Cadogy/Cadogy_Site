import "server-only"

import { describeDevice, displayIp } from "../domain/devices"
import { isUnfamiliarSignIn, networkOf } from "../domain/sign-in-alerts"
import { authDb } from "./database"
import { sendNewSignInAlert } from "./notices"

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000
const SIGN_IN_TYPES = [
  "sign_in",
  "sign_in_backup_code",
  "sign_in_passkey",
  "sign_in_magic_link",
]

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

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
      type: { $in: SIGN_IN_TYPES },
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
      when: `${dateTime.format(now)} UTC`,
    })
}
