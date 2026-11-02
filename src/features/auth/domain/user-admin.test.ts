import { describe, expect, it } from "vitest"

import { canDeleteAccount, checkUserAction } from "./user-admin"

const owner = { id: "u_owner", role: "owner" as const }
const admin = { id: "u_admin", role: "admin" as const }
const client = { id: "u_client", role: "client" as const }

const allowed = { ok: true, value: null }

describe("checkUserAction", () => {
  it("lets owners and admins manage clients", () => {
    for (const actor of [owner, admin])
      for (const action of [
        "ban",
        "unban",
        "revoke_sessions",
        "reset_two_factor",
      ] as const)
        expect(checkUserAction({ actor, target: client, action })).toEqual(
          allowed
        )
  })

  it("never lets anyone act on their own account here", () => {
    expect(
      checkUserAction({
        actor: admin,
        target: admin,
        action: "revoke_sessions",
      })
    ).toEqual({
      ok: false,
      error: "Use your own account settings for this.",
    })
  })

  it("leaves staff accounts to the owner", () => {
    expect(
      checkUserAction({
        actor: admin,
        target: { id: "u_admin_2", role: "admin" },
        action: "reset_two_factor",
      })
    ).toEqual({
      ok: false,
      error: "Only an owner can manage staff accounts.",
    })
    expect(
      checkUserAction({
        actor: owner,
        target: admin,
        action: "reset_two_factor",
      })
    ).toEqual(allowed)
    expect(
      checkUserAction({ actor: owner, target: admin, action: "ban" })
    ).toEqual(allowed)
  })

  it("never bans an owner", () => {
    expect(
      checkUserAction({
        actor: owner,
        target: { id: "u_owner_2", role: "owner" },
        action: "ban",
      })
    ).toEqual({
      ok: false,
      error: "Owners can't be banned. Change their role first.",
    })
  })

  it("keeps clients out entirely", () => {
    expect(
      checkUserAction({
        actor: client,
        target: { id: "u_other", role: "client" },
        action: "ban",
      })
    ).toEqual({
      ok: false,
      error: "You don't have permission to manage users.",
    })
  })

  it("lets only the owner impersonate, and only clients", () => {
    expect(
      checkUserAction({ actor: owner, target: client, action: "impersonate" })
    ).toEqual(allowed)
    expect(
      checkUserAction({ actor: admin, target: client, action: "impersonate" })
    ).toEqual({
      ok: false,
      error: "Only an owner can view the portal as a client.",
    })
    expect(
      checkUserAction({ actor: owner, target: admin, action: "impersonate" })
    ).toEqual({
      ok: false,
      error: "Only client accounts can be viewed this way.",
    })
  })
})

describe("canDeleteAccount", () => {
  it("lets clients with nothing owed delete their account", () => {
    expect(canDeleteAccount({ role: "client", openInvoices: 0 })).toEqual(
      allowed
    )
  })

  it("asks clients to settle open invoices first", () => {
    expect(canDeleteAccount({ role: "client", openInvoices: 2 })).toEqual({
      ok: false,
      error: "Please pay your 2 open invoices before deleting your account.",
    })
    expect(canDeleteAccount({ role: "client", openInvoices: 1 })).toMatchObject(
      {
        error: "Please pay your 1 open invoice before deleting your account.",
      }
    )
  })

  it("leaves staff account removal to the owner", () => {
    expect(canDeleteAccount({ role: "admin", openInvoices: 0 })).toEqual({
      ok: false,
      error:
        "Staff accounts are removed by an owner. Ask them to change your role first.",
    })
  })
})
