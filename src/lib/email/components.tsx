import type { ReactNode } from "react"
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

import { siteConfig } from "@/config/site"

import { color, darkModeCss, font } from "./theme"

/**
 * The frame every Cadogy email shares: logo, a single readable column and a
 * footer that says why the email was sent.
 */
export function EmailLayout({
  baseUrl,
  preview,
  reason,
  children,
}: {
  baseUrl: string
  /** The inbox preview line, shown after the subject. */
  preview: string
  /** "You're receiving this because…" */
  reason: string
  children: ReactNode
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{darkModeCss}</style>
      </Head>
      <Preview>{preview}</Preview>
      {/* React Email copies <Body> styles onto an unclassed cell, which dark
          mode rules can't reach, so the page color lives on this wrapper. */}
      <Body className="em-page" style={{ margin: 0 }}>
        <Section
          className="em-page"
          style={{
            backgroundColor: color.page,
            color: color.text,
            fontFamily: font,
          }}
        >
          <Container
            style={{
              maxWidth: "560px",
              margin: "0 auto",
              padding: "40px 24px",
            }}
          >
            <Section>
              <table role="presentation" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td
                      data-skip-in-text="true"
                      style={{ verticalAlign: "middle", paddingRight: "10px" }}
                    >
                      <Img
                        src={`${baseUrl}/email/logo.png`}
                        width="28"
                        height="28"
                        alt="Cadogy"
                        style={{ display: "block", borderRadius: "7px" }}
                      />
                    </td>
                    <td
                      className="em-text"
                      style={{
                        verticalAlign: "middle",
                        fontSize: "17px",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        color: color.text,
                      }}
                    >
                      {siteConfig.name}
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section style={{ paddingTop: "32px" }}>{children}</Section>

            <Hr
              className="em-border"
              style={{ borderColor: color.border, margin: "40px 0 20px" }}
            />
            <Text
              className="em-subtle"
              style={{
                margin: "0 0 6px",
                fontSize: "12px",
                lineHeight: "18px",
                color: color.subtle,
              }}
            >
              {reason}
            </Text>
            <Text
              className="em-subtle"
              style={{
                margin: 0,
                fontSize: "12px",
                lineHeight: "18px",
                color: color.subtle,
              }}
            >
              {siteConfig.name} · {siteConfig.location.label} ·{" "}
              <Link
                href={baseUrl}
                className="em-subtle"
                style={{ color: color.subtle, textDecoration: "underline" }}
              >
                {new URL(baseUrl).host.replace(/^www\./, "")}
              </Link>{" "}
              ·{" "}
              <Link
                href={`mailto:${siteConfig.email}`}
                className="em-subtle"
                style={{ color: color.subtle, textDecoration: "underline" }}
              >
                {siteConfig.email}
              </Link>
            </Text>
          </Container>
        </Section>
      </Body>
    </Html>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text
      className="em-muted"
      style={{
        margin: "0 0 6px",
        fontSize: "13px",
        lineHeight: "20px",
        color: color.muted,
      }}
    >
      {children}
    </Text>
  )
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <Text
      className="em-text"
      style={{
        margin: "0 0 16px",
        fontSize: "24px",
        lineHeight: "32px",
        fontWeight: 600,
        letterSpacing: "-0.02em",
        color: color.text,
      }}
    >
      {children}
    </Text>
  )
}

export function Paragraph({
  children,
  muted = false,
}: {
  children: ReactNode
  muted?: boolean
}) {
  return (
    <Text
      className={muted ? "em-muted" : "em-text"}
      style={{
        margin: "0 0 16px",
        fontSize: muted ? "14px" : "16px",
        lineHeight: muted ? "22px" : "26px",
        color: muted ? color.muted : color.text,
      }}
    >
      {children}
    </Text>
  )
}

/**
 * The one main action. Under it, the address in full: some clients and
 * security filters break buttons, and people like to see where a link goes.
 */
export function PrimaryAction({
  href,
  label,
  fallback = true,
}: {
  href: string
  label: string
  fallback?: boolean
}) {
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <Button
        href={href}
        className="em-button"
        style={{
          backgroundColor: color.button,
          color: color.buttonText,
          fontSize: "15px",
          fontWeight: 600,
          lineHeight: "20px",
          textDecoration: "none",
          borderRadius: "8px",
          padding: "12px 20px",
        }}
      >
        {label}
      </Button>
      {fallback ? (
        <Text
          className="em-subtle"
          style={{
            margin: "14px 0 0",
            fontSize: "12px",
            lineHeight: "18px",
            color: color.subtle,
          }}
        >
          Or open this link:{" "}
          <Link
            href={href}
            className="em-link"
            style={{ color: color.brand, wordBreak: "break-all" }}
          >
            {href}
          </Link>
        </Text>
      ) : null}
    </Section>
  )
}

export function TextLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="em-link"
      style={{ color: color.brand, textDecoration: "underline" }}
    >
      {children}
    </Link>
  )
}

export type DetailRow = {
  readonly label: string
  readonly value: string
  readonly strong?: boolean
}

/** Facts as labels and values, never buried in a sentence. */
export function Details({ rows }: { rows: readonly DetailRow[] }) {
  return (
    <Section
      className="em-surface"
      style={{
        backgroundColor: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: "12px",
        padding: "8px 20px",
        margin: "0 0 24px",
      }}
    >
      <table
        role="presentation"
        data-text="details"
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        style={{ fontSize: "14px", lineHeight: "20px" }}
      >
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.label}-${index}`}>
              <td
                className="em-muted"
                style={{
                  padding: "10px 16px 10px 0",
                  color: color.muted,
                  verticalAlign: "top",
                  fontWeight: row.strong ? 600 : 400,
                }}
              >
                {row.label}
              </td>
              <td
                className="em-text"
                align="right"
                style={{
                  padding: "10px 0",
                  color: color.text,
                  textAlign: "right",
                  verticalAlign: "top",
                  fontWeight: row.strong ? 600 : 400,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Section>
  )
}

/** The figure that matters, set large, like Stripe's invoices. */
export function Amount({
  label,
  amount,
  note,
}: {
  label: string
  amount: string
  note?: string
}) {
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <Text
        className="em-muted"
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: "20px",
          color: color.muted,
        }}
      >
        {label}
      </Text>
      <Text
        className="em-text"
        style={{
          margin: "2px 0 0",
          fontSize: "36px",
          lineHeight: "44px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: color.text,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {amount}
      </Text>
      {note ? (
        <Text
          className="em-muted"
          style={{
            margin: "2px 0 0",
            fontSize: "15px",
            lineHeight: "22px",
            color: color.muted,
          }}
        >
          {note}
        </Text>
      ) : null}
    </Section>
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <Section
      className="em-warning"
      style={{
        backgroundColor: color.warningSurface,
        border: `1px solid ${color.warningBorder}`,
        borderRadius: "12px",
        padding: "14px 18px",
        margin: "0 0 24px",
      }}
    >
      <Text
        className="em-warning"
        style={{
          margin: 0,
          fontSize: "14px",
          lineHeight: "22px",
          color: color.warningText,
        }}
      >
        {children}
      </Text>
    </Section>
  )
}

/** A message someone wrote, with who wrote it. */
export function Message({ author, body }: { author: string; body: string }) {
  const initial = author.trim().charAt(0).toUpperCase() || "?"
  return (
    <Section
      className="em-surface"
      style={{
        backgroundColor: color.surface,
        border: `1px solid ${color.border}`,
        borderRadius: "12px",
        padding: "18px 20px",
        margin: "0 0 24px",
      }}
    >
      <table role="presentation" cellPadding={0} cellSpacing={0}>
        <tbody>
          <tr>
            <td
              data-skip-in-text="true"
              style={{ verticalAlign: "middle", paddingRight: "10px" }}
            >
              <div
                className="em-button"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "14px",
                  backgroundColor: color.button,
                  color: color.buttonText,
                  fontSize: "13px",
                  fontWeight: 600,
                  lineHeight: "28px",
                  textAlign: "center",
                }}
              >
                {initial}
              </div>
            </td>
            <td
              className="em-text"
              style={{
                verticalAlign: "middle",
                fontSize: "14px",
                fontWeight: 600,
                color: color.text,
              }}
            >
              {author}
            </td>
          </tr>
        </tbody>
      </table>
      <Text
        className="em-text"
        style={{
          margin: "12px 0 0",
          fontSize: "15px",
          lineHeight: "24px",
          color: color.text,
          whiteSpace: "pre-wrap",
        }}
      >
        {body}
      </Text>
    </Section>
  )
}
