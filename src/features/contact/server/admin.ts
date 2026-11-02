"use server"

import { revalidatePath } from "next/cache"
import { requirePermission } from "@/features/auth/server/session"
import { isValidObjectId } from "mongoose"

import { connectToDatabase } from "@/lib/mongodb"

import {
  INQUIRY_STATUSES,
  type Inquiry,
  type InquiryStatus,
} from "../domain/schema"
import { InquiryModel, type InquiryDoc } from "./models"

export type StoredInquiry = Inquiry & { readonly id: string }

const toInquiry = ({ _id, ...rest }: InquiryDoc): StoredInquiry => ({
  ...rest,
  id: _id.toString(),
})

export async function listInquiries(
  status?: InquiryStatus
): Promise<StoredInquiry[]> {
  await requirePermission("inquiries:read")
  await connectToDatabase()
  const docs = await InquiryModel.find(
    status ? { status } : { status: { $ne: "spam" } }
  )
    .sort({ createdAt: -1 })
    .limit(200)
    .lean<InquiryDoc[]>()
  return docs.map(toInquiry)
}

export async function updateInquiryStatusAction(
  id: string,
  status: InquiryStatus
) {
  await requirePermission("inquiries:write")
  if (!isValidObjectId(id) || !INQUIRY_STATUSES.includes(status)) return
  await connectToDatabase()
  await InquiryModel.updateOne({ _id: id }, { $set: { status } })
  revalidatePath("/admin/inquiries")
  revalidatePath("/admin")
}
