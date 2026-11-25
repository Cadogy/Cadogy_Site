import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  buildClientSnapshot,
  buildInvoice,
  buildLineItem,
  buildPayment,
} from "../domain/test-factories"
import { InvoiceList } from "./invoice-list"

const NOW = new Date("2026-11-25T12:00:00.000Z")

describe("InvoiceList", () => {
  it("names the client on a draft, which has no snapshot yet", () => {
    render(
      <InvoiceList
        invoices={[buildInvoice({ id: "d1", clientId: "c9" })]}
        now={NOW}
        hrefFor={(invoice) => `/admin/billing/invoices/${invoice.id}`}
        clientName={(invoice) =>
          invoice.clientId === "c9" ? "Atlas Freight" : "Unknown"
        }
        emptyMessage="None"
      />
    )

    expect(screen.getByText("Atlas Freight")).toBeInTheDocument()
    expect(screen.getAllByText("Not sent yet").length).toBeGreaterThan(0)
  })

  it("uses the name on the issued invoice when there is one", () => {
    render(
      <InvoiceList
        invoices={[
          buildInvoice({
            id: "i1",
            number: "CAD-2026-0004",
            status: "open",
            issueDate: new Date("2026-11-21"),
            dueDate: new Date("2026-12-06"),
            clientSnapshot: buildClientSnapshot({ company: "Northwind Labs" }),
            lineItems: [buildLineItem({ unitAmount: 150_000 })],
          }),
        ]}
        now={NOW}
        hrefFor={() => "/x"}
        emptyMessage="None"
      />
    )

    expect(screen.getByText("Northwind Labs")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /CAD-2026-0004/ })).toHaveAttribute(
      "href",
      "/x"
    )
  })

  const issued = (overrides = {}) =>
    buildInvoice({
      id: "i2",
      number: "CAD-2026-0002",
      status: "open",
      issueDate: new Date("2026-10-16"),
      dueDate: new Date("2026-10-31"),
      clientSnapshot: buildClientSnapshot({ company: "Northwind Labs" }),
      lineItems: [buildLineItem({ quantity: 1, unitAmount: 158_000 })],
      ...overrides,
    })

  it("shows what a paid invoice came to, not a zero balance", () => {
    render(
      <InvoiceList
        invoices={[
          issued({
            status: "paid",
            payments: [buildPayment({ amount: 158_000 })],
          }),
        ]}
        now={NOW}
        hrefFor={() => "/x"}
        emptyMessage="None"
      />
    )
    const row = screen.getByRole("link", { name: /CAD-2026-0002/ })

    expect(within(row).getAllByText("$1,580.00").length).toBeGreaterThan(0)
    expect(within(row).queryByText("$0.00")).not.toBeInTheDocument()
  })

  it("leaves the client out for a client looking at their own invoices", () => {
    render(
      <InvoiceList
        invoices={[issued()]}
        now={NOW}
        hrefFor={() => "/x"}
        showClient={false}
        emptyMessage="None"
      />
    )

    expect(screen.queryByText("Northwind Labs")).not.toBeInTheDocument()
    expect(screen.queryByText("Client")).not.toBeInTheDocument()
  })
})
