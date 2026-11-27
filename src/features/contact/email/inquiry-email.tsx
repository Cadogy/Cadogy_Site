import {
  Details,
  EmailLayout,
  Eyebrow,
  Message,
  Paragraph,
  PrimaryAction,
  Title,
  type DetailRow,
} from "@/lib/email/components"

/** A new project inquiry for the team: the facts first, then their words. */
export function InquiryEmail({
  baseUrl,
  name,
  email,
  details,
  message,
}: {
  baseUrl: string
  name: string
  email: string
  details: readonly DetailRow[]
  message: string
}) {
  return (
    <EmailLayout
      baseUrl={baseUrl}
      preview={message.slice(0, 140)}
      reason="Sent to the Cadogy team from the contact form."
    >
      <Eyebrow>New inquiry</Eyebrow>
      <Title>{name} wants to talk</Title>
      <Details rows={details} />
      <Message author={name} body={message} />
      <PrimaryAction
        href={`mailto:${email}`}
        label={`Reply to ${name}`}
        fallback={false}
      />
      <Paragraph muted>
        Replying to this email also reaches {email}. The inquiry is saved in the
        admin under Inquiries.
      </Paragraph>
    </EmailLayout>
  )
}
