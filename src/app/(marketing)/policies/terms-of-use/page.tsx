import type { Metadata } from "next"
import {
  PolicyPage,
  type PolicySection,
} from "@/features/marketing/components/policy-page"

import { siteConfig } from "@/config/site"

export const metadata: Metadata = {
  title: "Terms of use",
  description:
    "The terms that apply to using cadogy.com and the Cadogy client portal.",
  alternates: { canonical: "/policies/terms-of-use" },
}

const sections: readonly PolicySection[] = [
  {
    title: "Using this site",
    paragraphs: [
      "By using cadogy.com or the Cadogy client portal you agree to these terms. If you don't agree, please don't use the site.",
    ],
    items: [
      "Don't use the site for anything unlawful or to send spam.",
      "Don't attempt to access accounts, invoices or data that aren't yours.",
      "Don't interfere with the site's security or performance.",
    ],
  },
  {
    title: "Client accounts",
    paragraphs: [
      "You're responsible for keeping your password confidential and for activity under your account. Tell us right away if you suspect unauthorized access.",
    ],
  },
  {
    title: "Project work and invoices",
    paragraphs: [
      "Engagements are governed by the proposal or agreement we sign with you. Where those documents conflict with these terms, the signed agreement wins.",
      "Invoices are due by the date shown on the invoice. Card payments are processed by Stripe and are subject to Stripe's terms.",
    ],
  },
  {
    title: "Content and intellectual property",
    paragraphs: [
      "Site content, including text, graphics, articles and our logo, belongs to Cadogy or its licensors. You may share links and short quotes with attribution. Ownership of work we create for clients is set out in each client agreement.",
    ],
  },
  {
    title: "Disclaimers and liability",
    paragraphs: [
      "The site and articles are provided for general information and “as is.” To the fullest extent permitted by law, Cadogy is not liable for indirect or consequential losses arising from use of the site.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update these terms from time to time and will change the effective date when we do. Continued use of the site means you accept the updated terms.",
    ],
  },
  {
    title: "Governing law and contact",
    paragraphs: [
      `These terms are governed by the laws of the State of Florida, United States. Questions? Email ${siteConfig.email}.`,
    ],
  },
]

export default function TermsOfUsePage() {
  return (
    <PolicyPage
      title="Terms of use"
      path="/policies/terms-of-use"
      effectiveDate="November 1, 2026"
      intro="These terms cover your use of cadogy.com and the Cadogy client portal."
      sections={sections}
    />
  )
}
