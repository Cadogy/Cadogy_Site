import { fail, ok, type Result } from "./invoice"

export const CONTACT_ROLES = ["billing", "viewer"] as const

export type ContactRole = (typeof CONTACT_ROLES)[number]

export type Contact = {
  readonly email: string
  readonly name: string
  readonly role: ContactRole
  readonly addedAt: Date
  readonly addedBy: string | null
}

type ClientContacts = {
  readonly email: string
  readonly contacts: readonly Contact[]
}

const normalize = (email: string) => email.trim().toLowerCase()

const isPrimary = (client: ClientContacts, email: string) =>
  normalize(client.email) === normalize(email)

const findContact = (client: ClientContacts, email: string) =>
  client.contacts.find((contact) => contact.email === normalize(email))

const PRIMARY_LOCKED =
  "The primary contact always handles billing. Change the primary email instead."
const NOT_A_CONTACT = "That person isn't on this account."

export const contactRoleFor = (
  client: ClientContacts,
  email: string
): ContactRole | null => {
  if (isPrimary(client, email)) return "billing"
  return findContact(client, email)?.role ?? null
}

export const billingRecipients = (client: ClientContacts) => [
  normalize(client.email),
  ...client.contacts
    .filter((contact) => contact.role === "billing")
    .map((contact) => contact.email),
]

export const addContact = (
  client: ClientContacts,
  input: {
    readonly email: string
    readonly name: string
    readonly role: ContactRole
  },
  meta: { readonly at: Date; readonly by: string | null }
): Result<Contact[]> => {
  const email = normalize(input.email)
  if (contactRoleFor(client, email))
    return fail(`${email} is already on this account.`)
  return ok([
    ...client.contacts,
    {
      email,
      name: input.name.trim(),
      role: input.role,
      addedAt: meta.at,
      addedBy: meta.by,
    },
  ])
}

export const changeContactRole = (
  client: ClientContacts,
  email: string,
  role: ContactRole
): Result<Contact[]> => {
  if (isPrimary(client, email)) return fail(PRIMARY_LOCKED)
  if (!findContact(client, email)) return fail(NOT_A_CONTACT)
  return ok(
    client.contacts.map((contact) =>
      contact.email === normalize(email) ? { ...contact, role } : contact
    )
  )
}

export const removeContact = (
  client: ClientContacts,
  email: string
): Result<Contact[]> => {
  if (isPrimary(client, email)) return fail(PRIMARY_LOCKED)
  if (!findContact(client, email)) return fail(NOT_A_CONTACT)
  return ok(
    client.contacts.filter((contact) => contact.email !== normalize(email))
  )
}
