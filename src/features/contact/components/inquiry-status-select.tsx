"use client"

import { useTransition } from "react"

import { NativeSelect } from "@/components/ui/native-select"

import { INQUIRY_STATUSES, type InquiryStatus } from "../domain/schema"
import { updateInquiryStatusAction } from "../server/admin"

export function InquiryStatusSelect({
  id,
  status,
}: {
  id: string
  status: InquiryStatus
}) {
  const [pending, startTransition] = useTransition()
  return (
    <NativeSelect
      aria-label="Inquiry status"
      className="w-36 capitalize"
      defaultValue={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value as InquiryStatus
        startTransition(() => updateInquiryStatusAction(id, next))
      }}
    >
      {INQUIRY_STATUSES.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </NativeSelect>
  )
}
