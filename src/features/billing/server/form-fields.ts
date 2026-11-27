import { parseMoneyInput } from "../domain/format"

export const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim()

export const optionalText = (formData: FormData, key: string) =>
  text(formData, key) || undefined

export const money = (formData: FormData, key: string) =>
  parseMoneyInput(text(formData, key)) ?? undefined

/** Blank is "none" (null); "1.5" and "1,5" both read as one and a half. */
export const optionalDecimal = (formData: FormData, key: string) => {
  const value = text(formData, key).replace(",", ".")
  return value ? Number(value) : null
}

export const whole = (formData: FormData, key: string) => {
  const value = text(formData, key)
  return value ? Number(value) : undefined
}

/**
 * Blank means "not set" (null); anything typed must be a valid amount, so a
 * typo never silently falls back to an inherited price.
 */
export const optionalMoney = (
  formData: FormData,
  key: string
): { ok: true; value: number | null } | { ok: false } => {
  const value = text(formData, key)
  if (!value) return { ok: true, value: null }
  const parsed = parseMoneyInput(value)
  return parsed === null ? { ok: false } : { ok: true, value: parsed }
}
