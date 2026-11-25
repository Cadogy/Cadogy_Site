import { parseMoneyInput } from "../domain/format"

export const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim()

export const optionalText = (formData: FormData, key: string) =>
  text(formData, key) || undefined

export const money = (formData: FormData, key: string) =>
  parseMoneyInput(text(formData, key)) ?? undefined

export const whole = (formData: FormData, key: string) => {
  const value = text(formData, key)
  return value ? Number(value) : undefined
}
