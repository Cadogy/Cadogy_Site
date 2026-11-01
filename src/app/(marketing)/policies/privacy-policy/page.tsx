import type { Metadata } from "next"
import {
  PolicyPage,
  type PolicySection,
} from "@/features/marketing/components/policy-page"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Cadogy collects, uses and protects personal information.",
  alternates: { canonical: "/policies/privacy-policy" },
}

const sections: readonly PolicySection[] = [
  {
    title: "Information we collect",
    items: [
      "Contact form submissions: your name, email address, company, project details and the message you send us.",
      "Client accounts: your email address, name and a securely hashed password.",
      "Billing records: invoice details, billing contact information and payment status. Card payments are processed by Stripe; we never see or store full card numbers.",
      "Technical data: IP address, browser type and basic request logs, used for security, spam prevention and keeping the site running.",
    ],
  },
  {
    title: "How we use it",
    items: [
      "To reply to your inquiry and provide the services you engage us for.",
      "To send invoices, receipts, account verification and password reset emails.",
      "To protect the site and our clients from fraud, spam and abuse.",
      "To meet legal, tax and accounting obligations.",
    ],
    paragraphs: [
      "We do not sell personal information, and we do not send marketing email without your permission.",
    ],
  },
  {
    title: "Service providers",
    paragraphs: [
      "We share information only with providers that help us operate: hosting (Vercel), database hosting (MongoDB Atlas), email delivery (Resend), payment processing (Stripe), bot protection (Cloudflare Turnstile) and our article platform (WordPress). Each processes data only to provide its service to us.",
    ],
  },
  {
    title: "Retention",
    paragraphs: [
      "We keep inquiries for as long as needed to respond and follow up, account data while your account is active, and billing records for as long as tax and accounting law requires. Security logs and rate-limit records expire automatically.",
    ],
  },
  {
    title: "Your choices",
    items: [
      "Ask for a copy of the personal information we hold about you.",
      "Ask us to correct or delete it, subject to records we must keep by law.",
      "Close your client account at any time.",
    ],
    paragraphs: [
      `To make a request, email ${siteConfig.email}. We'll respond within 30 days.`,
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use encrypted connections, hashed passwords, access controls and monitoring to protect your information. No system is perfectly secure, but we treat your data the way we'd want ours treated.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      `If we change this policy we will update the effective date above. Questions? Email ${siteConfig.email}.`,
    ],
  },
]

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      path="/policies/privacy-policy"
      effectiveDate="November 1, 2026"
      intro="This policy explains what personal information Cadogy collects when you use cadogy.com or our client portal, why we collect it and the choices you have."
      sections={sections}
    />
  )
}
