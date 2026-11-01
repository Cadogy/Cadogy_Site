type JsonLdProps = { readonly data: object | readonly object[] }

const serialize = (data: JsonLdProps["data"]) =>
  JSON.stringify(data).replace(/</g, "\\u003c")

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  )
}
