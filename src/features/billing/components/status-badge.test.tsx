import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StatusBadge } from "./status-badge"

describe("StatusBadge", () => {
  it.each([
    ["refunded", "Refunded"],
    ["partially_refunded", "Partially refunded"],
    ["settled_by_credit", "Settled by credit"],
    ["disputed", "Disputed"],
  ] as const)("labels %s invoices", (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
