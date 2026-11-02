import { describe, expect, it } from "vitest"

import {
  addContact,
  billingRecipients,
  changeContactRole,
  contactRoleFor,
  removeContact,
  type Contact,
} from "./contacts"

const AT = new Date("2026-11-02T12:00:00.000Z")

const contact = (overrides: Partial<Contact> = {}): Contact => ({
  email: "lead@acme.example",
  name: "Project Lead",
  role: "viewer",
  addedAt: AT,
  addedBy: "u_owner",
  ...overrides,
})

const client = (contacts: readonly Contact[] = []) => ({
  email: "finance@acme.example",
  contacts,
})

describe("contactRoleFor", () => {
  it("treats the primary email as a billing contact", () => {
    expect(contactRoleFor(client(), " Finance@Acme.example ")).toBe("billing")
  })

  it("returns the role of other contacts and null for strangers", () => {
    const acme = client([contact()])
    expect(contactRoleFor(acme, "LEAD@acme.example")).toBe("viewer")
    expect(contactRoleFor(acme, "eve@example.com")).toBeNull()
  })
})

describe("billingRecipients", () => {
  it("sends billing email to the primary and billing contacts only", () => {
    const acme = client([
      contact(),
      contact({ email: "ap@acme.example", role: "billing" }),
    ])
    expect(billingRecipients(acme)).toEqual([
      "finance@acme.example",
      "ap@acme.example",
    ])
  })
})

describe("addContact", () => {
  it("adds a normalized contact", () => {
    expect(
      addContact(
        client(),
        { email: " Lead@ACME.example ", name: "Project Lead", role: "viewer" },
        { at: AT, by: "u_owner" }
      )
    ).toEqual({ ok: true, value: [contact()] })
  })

  it("rejects people who are already contacts, including the primary", () => {
    expect(
      addContact(
        client([contact()]),
        { email: "lead@acme.example", name: "", role: "billing" },
        { at: AT, by: null }
      )
    ).toEqual({
      ok: false,
      error: "lead@acme.example is already on this account.",
    })
    expect(
      addContact(
        client(),
        { email: "finance@acme.example", name: "", role: "viewer" },
        { at: AT, by: null }
      )
    ).toMatchObject({ ok: false })
  })
})

describe("changeContactRole", () => {
  it("changes a contact's role", () => {
    expect(
      changeContactRole(client([contact()]), "lead@acme.example", "billing")
    ).toEqual({ ok: true, value: [contact({ role: "billing" })] })
  })

  it("keeps the primary contact on billing", () => {
    expect(
      changeContactRole(client(), "finance@acme.example", "viewer")
    ).toEqual({
      ok: false,
      error:
        "The primary contact always handles billing. Change the primary email instead.",
    })
  })

  it("reports unknown contacts", () => {
    expect(changeContactRole(client(), "eve@example.com", "viewer")).toEqual({
      ok: false,
      error: "That person isn't on this account.",
    })
  })
})

describe("removeContact", () => {
  it("removes a contact", () => {
    expect(removeContact(client([contact()]), "lead@acme.example")).toEqual({
      ok: true,
      value: [],
    })
  })

  it("never removes the primary contact", () => {
    expect(removeContact(client(), "finance@acme.example")).toMatchObject({
      ok: false,
    })
  })
})
