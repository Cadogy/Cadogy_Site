const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

export const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character)

type LayoutInput = {
  readonly baseUrl: string
  readonly preheader: string
  readonly body: string
}

export const emailLayout = ({
  baseUrl,
  preheader,
  body,
}: LayoutInput) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cadogy</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <span style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <div style="padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
        <div style="padding:24px 32px;border-bottom:1px solid #e4e4e7;font-weight:600;font-size:16px;letter-spacing:-0.01em;">Cadogy</div>
        <div style="padding:32px;font-size:15px;line-height:24px;">${body}</div>
        <div style="padding:20px 32px;border-top:1px solid #e4e4e7;font-size:12px;line-height:18px;color:#71717a;">
          Cadogy · <a href="${baseUrl}" style="color:#71717a;">cadogy.com</a> ·
          <a href="mailto:hello@cadogy.com" style="color:#71717a;">hello@cadogy.com</a>
        </div>
      </div>
    </div>
  </body>
</html>`

export const emailButton = (href: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:8px;">${escapeHtml(label)}</a></p>`
