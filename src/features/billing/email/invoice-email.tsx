import {
  Amount,
  Details,
  EmailLayout,
  Eyebrow,
  Notice,
  Paragraph,
  PrimaryAction,
  TextLink,
  Title,
  type DetailRow,
} from "@/lib/email/components"

export type InvoiceEmailProps = {
  readonly baseUrl: string
  readonly preview: string
  readonly reason: string
  readonly eyebrow: string
  readonly title: string
  readonly greeting: string
  readonly intro: readonly string[]
  readonly amount: {
    readonly label: string
    readonly value: string
    readonly note?: string
  }
  readonly notice?: string
  readonly url: string
  readonly cta: string
  readonly secondary?: { readonly href: string; readonly label: string }
  readonly summary: readonly DetailRow[]
  readonly closing: string
}

/** Invoices, reminders and receipts: the amount first, then one action. */
export function InvoiceEmail({
  baseUrl,
  preview,
  reason,
  eyebrow,
  title,
  greeting,
  intro,
  amount,
  notice,
  url,
  cta,
  secondary,
  summary,
  closing,
}: InvoiceEmailProps) {
  return (
    <EmailLayout baseUrl={baseUrl} preview={preview} reason={reason}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Title>{title}</Title>
      <Paragraph>{greeting}</Paragraph>
      {intro.map((paragraph) => (
        <Paragraph key={paragraph}>{paragraph}</Paragraph>
      ))}
      <Amount label={amount.label} amount={amount.value} note={amount.note} />
      {notice ? <Notice>{notice}</Notice> : null}
      <PrimaryAction href={url} label={cta} fallback={false} />
      {secondary ? (
        <Paragraph muted>
          <TextLink href={secondary.href}>{secondary.label}</TextLink>
        </Paragraph>
      ) : null}
      <Details rows={summary} />
      <Paragraph muted>{closing}</Paragraph>
    </EmailLayout>
  )
}
