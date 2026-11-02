import "server-only"

import { LOCKOUT } from "../application/lockout"
import { describeDevice, displayIp } from "../domain/devices"
import { ROLE_LABELS, toRole } from "../domain/permissions"
import { eventsInGroup, securityEventLabel } from "../domain/security-events"
import { authDb, userObjectId, users } from "./database"
import { securityLog } from "./security-log"

const dateTime = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export const staffSecurity = async () => {
  const staff = await users()
    .find({ role: { $in: ["owner", "admin"] } })
    .sort({ createdAt: 1 })
    .toArray()
  const passkeys = await authDb
    .collection("passkey")
    .aggregate<{ _id: unknown; count: number }>([
      { $match: { userId: { $in: staff.map((member) => member._id) } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
    ])
    .toArray()
  return staff.map((member) => ({
    id: member._id.toHexString(),
    email: member.email,
    name: member.name,
    role: ROLE_LABELS[toRole(member.role)],
    twoFactor: Boolean(member.twoFactorEnabled),
    passkeys:
      passkeys.find((entry) => String(entry._id) === member._id.toHexString())
        ?.count ?? 0,
  }))
}

export const activeLockouts = async () => {
  const since = new Date(Date.now() - LOCKOUT.windowMinutes * 60_000)
  return authDb
    .collection("sign_in_failures")
    .aggregate<{ _id: string; count: number; last: Date }>([
      { $match: { at: { $gte: since } } },
      { $group: { _id: "$email", count: { $sum: 1 }, last: { $max: "$at" } } },
      { $match: { count: { $gte: LOCKOUT.maxFailures } } },
      { $sort: { last: -1 } },
    ])
    .toArray()
}

export const studioLog = async (group: string | undefined) => {
  const events = await securityLog.recent(
    group ? (eventsInGroup(group) ?? undefined) : undefined
  )
  const objectIds = [
    ...new Set(events.flatMap((event) => [event.actorId, event.targetId])),
  ].flatMap((id) => {
    const objectId = id ? userObjectId(id) : null
    return objectId ? [objectId] : []
  })
  const people = await users()
    .find({ _id: { $in: objectIds } })
    .toArray()
  const emailOf = (id: string | null) =>
    id
      ? (people.find((person) => person._id.toHexString() === id)?.email ??
        "Deleted account")
      : null
  return events.map((event) => ({
    key: `${event.type}-${event.at.getTime()}-${event.targetId ?? ""}`,
    label: securityEventLabel(event.type),
    warning: eventsInGroup("failures")?.includes(event.type) ?? false,
    actor: emailOf(event.actorId),
    target: emailOf(event.targetId),
    detail: event.detail ?? "",
    device: event.userAgent ? describeDevice(event.userAgent) : "Automatic",
    ip: displayIp(event.ip),
    when: `${dateTime.format(event.at)} UTC`,
  }))
}
