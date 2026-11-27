import {
  EmailLayout,
  Eyebrow,
  Message,
  Paragraph,
  PrimaryAction,
  Title,
} from "@/lib/email/components"

/** A new message on a support request, shown as the message itself. */
export function SupportEmail({
  baseUrl,
  audience,
  subject,
  author,
  message,
  url,
}: {
  baseUrl: string
  audience: "client" | "team"
  subject: string
  author: string
  message: string
  url: string
}) {
  const client = audience === "client"
  return (
    <EmailLayout
      baseUrl={baseUrl}
      preview={message.slice(0, 140)}
      reason={
        client
          ? "You're receiving this because you opened a support request with Cadogy."
          : "Sent to the Cadogy team."
      }
    >
      <Eyebrow>Support request · {subject}</Eyebrow>
      <Title>{client ? "New reply to your request" : `${author} wrote`}</Title>
      <Message author={author} body={message} />
      <PrimaryAction
        href={url}
        label={client ? "Reply in your portal" : "Open the ticket"}
        fallback={false}
      />
      <Paragraph muted>
        {client
          ? "Please reply in the portal rather than to this email, so the whole conversation stays together with your request."
          : "Replying to this email goes straight to the client. Reply from the ticket to keep the conversation on record."}
      </Paragraph>
    </EmailLayout>
  )
}
