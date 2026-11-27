import type { ReactElement } from "react"
import { render } from "@react-email/components"

export type RenderedBody = { readonly html: string; readonly text: string }

/** HTML for the email and a plain-text version from the same template. */
export const renderEmail = async (
  element: ReactElement
): Promise<RenderedBody> => {
  const [html, text] = await Promise.all([
    render(element),
    render(element, {
      plainText: true,
      // Keep label/value rows apart in the text version: "Total   $60.00".
      htmlToTextOptions: {
        wordwrap: false,
        selectors: [
          {
            selector: "table[data-text=details]",
            format: "dataTable",
            options: { uppercaseHeaderCells: false, colSpacing: 4 },
          },
        ],
      },
    }),
  ])
  return { html, text }
}
