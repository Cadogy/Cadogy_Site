import { describe, expect, it } from "vitest"

import { checkRoleChange, shouldBecomeOwner } from "./roles"

const owner = { id: "u_owner", role: "owner" as const }
const admin = { id: "u_admin", role: "admin" as const }
const client = { id: "u_client", role: "client" as const }

describe("checkRoleChange", () => {
  it("lets the owner promote a client to admin", () => {
    expect(
      checkRoleChange({
        actor: owner,
        target: client,
        nextRole: "admin",
        ownerCount: 1,
      })
    ).toEqual({ ok: true, value: null })
  })

  it("lets the owner add another owner", () => {
    expect(
      checkRoleChange({
        actor: owner,
        target: admin,
        nextRole: "owner",
        ownerCount: 1,
      })
    ).toMatchObject({ ok: true })
  })

  it("stops admins from changing roles", () => {
    expect(
      checkRoleChange({
        actor: admin,
        target: client,
        nextRole: "admin",
        ownerCount: 1,
      })
    ).toEqual({ ok: false, error: "Only an owner can change roles." })
  })

  it("stops anyone from changing their own role", () => {
    expect(
      checkRoleChange({
        actor: owner,
        target: owner,
        nextRole: "admin",
        ownerCount: 2,
      })
    ).toEqual({ ok: false, error: "You can't change your own role." })
  })

  it("keeps at least one owner", () => {
    const otherOwner = { id: "u_owner_2", role: "owner" as const }
    expect(
      checkRoleChange({
        actor: owner,
        target: otherOwner,
        nextRole: "admin",
        ownerCount: 1,
      })
    ).toEqual({ ok: false, error: "There must always be at least one owner." })
    expect(
      checkRoleChange({
        actor: owner,
        target: otherOwner,
        nextRole: "admin",
        ownerCount: 2,
      })
    ).toMatchObject({ ok: true })
  })

  it("rejects a change to the role the user already has", () => {
    expect(
      checkRoleChange({
        actor: owner,
        target: admin,
        nextRole: "admin",
        ownerCount: 1,
      })
    ).toEqual({ ok: false, error: "This user already has that role." })
  })
})

describe("shouldBecomeOwner", () => {
  const base = {
    email: "charles@example.com",
    emailVerified: true,
    ownerEmail: "Charles@Example.com ",
    ownerExists: false,
  }

  it("promotes the configured email once it's verified and no owner exists", () => {
    expect(shouldBecomeOwner(base)).toBe(true)
  })

  it("never promotes when an owner already exists", () => {
    expect(shouldBecomeOwner({ ...base, ownerExists: true })).toBe(false)
  })

  it("waits for email verification", () => {
    expect(shouldBecomeOwner({ ...base, emailVerified: false })).toBe(false)
  })

  it("ignores other emails and a missing setting", () => {
    expect(shouldBecomeOwner({ ...base, email: "eve@example.com" })).toBe(false)
    expect(shouldBecomeOwner({ ...base, ownerEmail: undefined })).toBe(false)
    expect(shouldBecomeOwner({ ...base, ownerEmail: "" })).toBe(false)
  })
})
