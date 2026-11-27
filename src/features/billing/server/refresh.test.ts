// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const revalidated = vi.hoisted(() => [] as string[])

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => revalidated.push(path),
}))

const { refreshBilling } = await import("./refresh")

describe("refreshBilling", () => {
  beforeEach(() => {
    revalidated.length = 0
  })

  it("refreshes every shared billing page, for staff and clients", () => {
    refreshBilling()

    expect(revalidated).toEqual(
      expect.arrayContaining([
        "/admin",
        "/admin/billing/invoices",
        "/admin/billing/clients",
        "/admin/billing/catalog",
        "/admin/billing/credit-notes",
        "/dashboard/billing",
        "/dashboard/team",
      ])
    )
  })

  it("adds the client's and the invoice's own pages", () => {
    refreshBilling({ clientId: "c1", invoiceId: "i1" })

    expect(revalidated).toContain("/admin/billing/clients/c1")
    expect(revalidated).toContain("/admin/billing/invoices/i1")
  })
})
