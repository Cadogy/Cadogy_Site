import {
  Details,
  EmailLayout,
  Paragraph,
  PrimaryAction,
  Title,
  type DetailRow,
} from "./components"

export type ActionEmailProps = {
  readonly baseUrl: string
  readonly preview: string
  readonly title: string
  readonly intro: readonly string[]
  readonly details?: readonly DetailRow[]
  readonly url: string
  readonly cta: string
  readonly outro: string
  readonly reason: string
}

/** One message, one action: sign-in links, confirmations, alerts. */
export function ActionEmail({
  baseUrl,
  preview,
  title,
  intro,
  details,
  url,
  cta,
  outro,
  reason,
}: ActionEmailProps) {
  return (
    <EmailLayout baseUrl={baseUrl} preview={preview} reason={reason}>
      <Title>{title}</Title>
      {intro.map((paragraph) => (
        <Paragraph key={paragraph}>{paragraph}</Paragraph>
      ))}
      {details && details.length > 0 ? <Details rows={details} /> : null}
      <PrimaryAction href={url} label={cta} />
      <Paragraph muted>{outro}</Paragraph>
    </EmailLayout>
  )
}
