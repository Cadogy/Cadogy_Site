<div align="center">

# Cadogy

**The website, client portal and billing platform behind [cadogy.com](https://cadogy.com).**

[![CI](https://github.com/Cadogy/Cadogy_Site/actions/workflows/ci.yml/badge.svg)](https://github.com/Cadogy/Cadogy_Site/actions/workflows/ci.yml)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React 19](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)
![Node 24](https://img.shields.io/badge/Node-24.x-5fa04e?logo=node.js&logoColor=white)
![License: source-available](https://img.shields.io/badge/license-source--available-lightgrey)

[Website](https://cadogy.com) · [Work](https://cadogy.com/work) · [Services](https://cadogy.com/services) · [Contact](https://cadogy.com/contact)

</div>

---

## About Cadogy

Cadogy is a senior software studio in South Florida, founded in 2020 by **Charles Knapp** (engineering) and **Dylan Safra** (business). We're a two-person team. We design, build and run web apps, marketplaces, payment systems and AI features for growing businesses, and we stay accountable for what we ship long after launch.

This repository is the code that runs our own business: the marketing site, the portal our clients sign in to, and the invoicing system we bill them with.

## Why this code is public

We'd rather show how we work than describe it. You'll find the same standards here that we bring to client projects:

- **Tested business logic.** Domain rules are pure functions, written test-first. The suite has nearly 500 tests: more than 200 for billing and another 140 for sign-in and account security.
- **Security by default.** Every state-changing request is checked on the server against a named permission. Staff accounts require two-factor authentication. Bot protection fails closed in production.
- **Money handled carefully.** Amounts are integer minor units. Issued invoices never change: mistakes are corrected with numbered credit notes, and every Stripe event is processed exactly once.
- **No dead code.** Unused files, exports and dependencies fail CI.

The code is **source-available, not open source**. Read it, learn from it and reference it. To reuse any part of it, [ask us first](#license).

## What's inside

| Area                | Routes                                                     | What it does                                                                                                        |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Marketing site**  | `/`, `/services`, `/work`, `/work/[slug]`, `/who-we-are`   | Static pages and case studies with structured data, revalidated hourly.                                             |
| **Articles**        | `/articles`, `/articles/[slug]`, category and tag pages    | Headless WordPress, with every post's HTML sanitized before render.                                                 |
| **Contact intake**  | `/contact` → `/admin/inquiries`                            | Spam-resistant project inquiries (see [Security](#security)).                                                       |
| **Sign-in**         | `/login`, `/register`, `/forgot-password`, `/verify-email` | Passwords, passkeys, magic links and two-factor authentication (see [Accounts and sign-in](#accounts-and-sign-in)). |
| **Account**         | `/account`, `/account/security`                            | Profile, email changes, password, passkeys, two-factor, active sessions and account deletion.                       |
| **Client portal**   | `/dashboard/*`                                             | Invoices, payments, autopay, credits, team members and support tickets.                                             |
| **Hosted invoices** | `/invoice/[token]`, `/invoice/access/[token]`              | Invoice pages anyone with the link can pay, plus email-verified requests to join the client's team.                 |
| **Studio admin**    | `/admin/*`                                                 | Clients, invoices, credit notes, services catalog, billing settings, inquiries, tickets, users and security.        |
| **Billing run**     | `/api/cron/billing`                                        | Daily job that renews services, issues invoices, applies credit, collects and reminds.                              |
| **Stripe webhook**  | `/api/webhooks/stripe`                                     | Records payments, saved cards, refunds and disputes, each exactly once.                                             |

### Billing in more detail

**Invoicing**

- **Immutable invoices.** Drafts can be edited freely. Issuing assigns a gapless yearly number (`INV-2026-0001`), snapshots the client's details and locks the invoice.
- **Shareable payment links.** Every invoice has a private link that anyone can open and pay by card, no account needed. Staff can copy it or email it to the client's billing contacts.
- **Clear statuses.** Draft, open, overdue, paid, partially refunded, refunded, settled by credit, disputed, void and uncollectible.
- **Print-ready.** Invoices print cleanly or save as PDF from the browser.

**Client teams**

- **Contacts with roles.** Each client has a primary contact plus any number of teammates. _Billing_ contacts receive every invoice, pay, manage saved cards and invite others. _Viewers_ can see and pay invoices.
- **Link an invoice to your account.** If you open an invoice while signed in as one of the client's contacts, it's already in your portal. Anyone else can ask for access: the billing contacts get a one-time link (stored hashed, valid for 7 days) to approve or decline.

**Recurring services**

- **Services catalog.** Keep a price list, then add services to any client. Each client keeps the price they signed up at.
- **Recurring and one-off charges.** Bill monthly, quarterly, yearly or once. Pause, resume or cancel at any time. Paused periods are never billed.
- **One invoice per client.** Everything due on the same day goes on a single invoice, or you can bill selected charges separately.
- **Pay several invoices at once.** Clients choose which open invoices to pay and settle them in one Stripe Checkout.
- **Opt-in autopay.** Clients save a card through Stripe, and renewals are charged automatically. If a charge fails, the client gets an email asking them to pay manually.
- **Reminders on a schedule.** Defaults are 3 days before the due date, on the due date, and 7 and 14 days after. Each reminder is sent once.
- **Safe to retry.** The daily run can run twice without double-billing or double-charging anyone.

**Refunds, credits and disputes**

- **Numbered credit notes.** Every refund or credit is a credit note (`CN-2026-0001`) with a reason, numbered without gaps. A refund Stripe declines records nothing and uses no number.
- **Three kinds.** _Refunds_ return money to the card through Stripe. _Invoice credits_ lower what's owed without moving money. _Account credit_ builds a balance for the client.
- **Credit is used first.** Account credit is applied when an invoice is issued, before autopay charges a card.
- **Approval for large amounts.** Staff can issue credit notes up to $1,000. Larger ones need the owner.
- **Stripe stays in sync.** Refunds made in the Stripe dashboard are recorded automatically. A dispute flags the invoice, pauses the client's autopay and alerts the studio. A lost dispute is recorded as a refund.

## Accounts and sign-in

Sign-in is built on Better Auth with database sessions, so revoking a session or changing a role takes effect on the next request.

- **Ways to sign in.** Email and password, passkeys, and magic links that expire after 15 minutes.
- **Strong passwords.** At least 12 characters, and checked against known breaches before they're accepted.
- **Two-factor authentication.** Authenticator-app codes with backup codes. Required for staff, optional for clients.
- **Re-authentication.** Sensitive changes, like your email, password or two-factor settings, need a sign-in from the last 10 minutes.
- **Lockout and alerts.** Ten failed sign-ins within 15 minutes lock the account temporarily and email the account holder. A sign-in from an unfamiliar device or network sends an alert.
- **Sessions you can see.** Every account lists its active sessions and can sign any of them out.
- **Roles and permissions.** Three roles (owner, admin, client) map to named permissions such as `billing:write`. The code checks permissions, never role names. Role changes go through one service that protects the owner and signs the affected person out everywhere.
- **Support access.** Staff with permission can view the portal as a client for up to 30 minutes to help with a problem. Sensitive actions are blocked while they do.
- **Security log.** Sign-ins, failures, lockouts and role changes are recorded and shown to the owner at `/admin/security`.

## Tech stack

| Layer          | Choice                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| Framework      | [Next.js 16](https://nextjs.org) (App Router, Server Actions, Turbopack)  |
| UI             | React 19, Tailwind CSS 4, Radix primitives, Geist and Instrument Serif    |
| Language       | TypeScript in strict mode, Zod at every trust boundary                    |
| Data           | MongoDB with Mongoose                                                     |
| Auth           | Better Auth (database sessions, passkeys, two-factor, magic links, roles) |
| Payments       | Stripe Checkout, saved cards, off-session payments, refunds and disputes  |
| Email          | Resend                                                                    |
| Bot protection | Cloudflare Turnstile                                                      |
| Content        | Headless WordPress REST API                                               |
| Testing        | Vitest, Testing Library, happy-dom                                        |
| Hosting        | Vercel (including Vercel Cron)                                            |

## Architecture

Code is organized by feature, not by file type. Each feature keeps its rules, orchestration, adapters and UI together:

```text
src/features/<feature>/
├── domain/        pure types, schemas and rules: no I/O, fully unit tested
├── application/   services that apply domain rules through ports (interfaces)
├── server/        adapters: Mongoose models, Server Actions, Stripe, email
└── components/    UI for the feature
```

Services depend on ports, never on Mongoose or Stripe directly. That keeps the core logic fast to test with in-memory doubles, and lets us swap infrastructure without rewriting rules. **Billing** is the reference implementation:

```text
Vercel Cron ─▶ /api/cron/billing ─▶ billing engine ─┬─▶ domain rules (periods, consolidation, credits, reminders)
                                                    ├─▶ repository port ─▶ MongoDB
                                                    ├─▶ payment gateway port ─▶ Stripe
                                                    └─▶ notifier port ─▶ Resend

Stripe ─▶ /api/webhooks/stripe ─▶ verify signature ─▶ claim event id once ─┬─▶ payments and saved cards
                                                                           └─▶ refunds and disputes ─▶ credit notes
```

A few rules hold everywhere:

- **Money is an integer.** Every amount is in minor units (cents), and invoice totals come from one pure function.
- **History is append-only.** Issued invoices are never edited. Payments, credit notes and events are added, and totals are derived from them.
- **External calls are idempotent.** Stripe requests carry idempotency keys, and each webhook event id is claimed once in the database before it's processed.

<details>
<summary><strong>Repository layout</strong></summary>

```text
src/
├── app/                 routes: (marketing), (account), (portal), api, invoice
├── components/          shared UI: layout, media, portal shell, primitives
├── config/              site facts and HTTP security headers
├── features/            account, articles, auth, billing, contact, marketing, support, users
├── lib/                 auth, database, email, SEO, security helpers
├── styles/              design tokens and global styles
├── proxy.ts             request guard (same-origin checks, route protection)
└── env.ts               validated environment variables
```

</details>

## Security

We treat security as part of the product, not a final checklist.

- **Server-side authorization.** Every Server Action and admin query checks a named permission against a database-backed session, so role changes and revocations apply on the next request. A test fails the build if an action ships without a check.
- **Same-origin checks.** State-changing API routes reject cross-origin requests. Stripe webhooks verify signatures instead.
- **Bot protection.** Public forms use Cloudflare Turnstile, which fails closed in production. They also use a honeypot, signed timing tokens, rate limits and content checks.
- **No account enumeration.** Sign-in, sign-up and password-reset responses never reveal whether an account exists.
- **Safe third-party HTML.** WordPress content is sanitized before it's rendered.
- **Hardened headers.** These include frame, referrer and permissions policies, plus a Content Security Policy in report-only mode while it's tuned. Cache tiers are tested so private pages are never cached publicly.
- **Constant-time secrets.** Cron requests are authenticated with a bearer secret compared in constant time.

**Found a vulnerability?** Please email [hello@cadogy.com](mailto:hello@cadogy.com) with the details rather than opening a public issue.

## How we test

- **Domain first.** Rules like invoice totals, renewal periods, credit notes and permissions are pure functions with focused unit tests.
- **Services with in-memory doubles.** Application services run against in-memory repositories, a fake clock and fake gateways, so whole workflows (issue, pay, refund, dispute) are tested in milliseconds.
- **Components through the user's eyes.** UI tests use Testing Library and find things the way people do: by role, label and text.
- **Guard rails as tests.** One test fails if any Server Action ships without an authorization check. Others check that security headers and cache tiers stay correct.
- **End-to-end before release.** Larger features are run in a real browser against a throwaway database before they ship.

## Getting started

**Requirements:** Node 24 (see `.nvmrc`), npm, and a MongoDB database. Stripe, Resend and Turnstile are optional for local development.

```bash
git clone https://github.com/Cadogy/Cadogy_Site.git
cd Cadogy_Site
nvm use
npm ci
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Set `OWNER_EMAIL` to your email, then register and verify that address. Your account becomes the owner automatically. From then on, manage roles from `/admin/users`.

### Environment variables

| Variable                                                 | Required      | Purpose                                                      |
| -------------------------------------------------------- | ------------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`                 | Yes           | Public site URL                                              |
| `BETTER_AUTH_SECRET`                                     | Yes           | Signs sessions and tokens (`openssl rand -base64 32`)        |
| `OWNER_EMAIL`                                            | Recommended   | The first verified account with this email becomes the owner |
| `MONGODB_URI`                                            | Yes           | Database connection                                          |
| `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_NOTIFY_EMAIL`     | For email     | Transactional email and admin notifications                  |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | In production | Bot protection on public forms                               |
| `FORM_SIGNING_SECRET`                                    | Recommended   | Signs contact-form timing tokens                             |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`             | For payments  | Online payment, saved cards, autopay                         |
| `CRON_SECRET`                                            | For billing   | Authenticates the daily billing run                          |
| `NEXT_PUBLIC_WP_API_URL`                                 | No            | WordPress API (defaults to wp.cadogy.com)                    |

Without Stripe keys, invoicing still works and the online payment options are simply hidden. Without Resend, emails are logged instead of sent.

## Scripts

| Command                       | What it does                                              |
| ----------------------------- | --------------------------------------------------------- |
| `npm run dev`                 | Start the dev server                                      |
| `npm run build` / `npm start` | Production build and server                               |
| `npm test`                    | Run the test suite                                        |
| `npm run lint`                | ESLint (Next.js core web vitals and TypeScript rules)     |
| `npm run typecheck`           | Strict type check, including unused locals and parameters |
| `npm run knip`                | Find unused files, exports and dependencies               |
| `npm run format`              | Format with Prettier                                      |
| `npm run verify`              | Lint, typecheck, test and knip in one go                  |

CI runs `verify` plus a production build on every pull request and every push to `main`.

## Deployment

The site runs on Vercel.

1. **Environment variables.** Set the variables above in your Vercel project.
2. **Stripe webhook.** Add an endpoint at `https://<your-domain>/api/webhooks/stripe` for the `checkout.session.completed`, `refund.created`, `charge.dispute.created` and `charge.dispute.closed` events, and copy its signing secret into `STRIPE_WEBHOOK_SECRET`.
3. **Billing run.** Set `CRON_SECRET`. Vercel Cron then calls `/api/cron/billing` every day at 14:00 UTC, as defined in `vercel.json`. Admins can also start a run from **Billing settings**.
4. **Passkeys.** Passkeys are tied to the domain in `NEXT_PUBLIC_APP_URL`, with any `www.` dropped, so they work on both the bare domain and `www`. Changing domains means people register their passkeys again.

## What's next

- **Proration.** Charge or credit by the day when a service changes mid-period.
- **Smarter autopay.** Retry failed card payments automatically and warn clients before a saved card expires.
- **Statements.** Account statements for any date range, with a running balance.

## Contributing

This is our production codebase, so we don't accept unsolicited pull requests. If you spot a bug or have a question, open an issue and we'll take a look. Report security issues privately, as described above.

## Work with us

Need a web app, marketplace, payment system or AI feature built and run properly? Tell us about it at [cadogy.com/contact](https://cadogy.com/contact) or [hello@cadogy.com](mailto:hello@cadogy.com).

## License

Copyright © 2026 Cadogy, LLC. All rights reserved.

This code is published for reference under a proprietary license. See [LICENSE](LICENSE) for details. You may view and fork it on GitHub as GitHub's terms allow. Copying, redistributing or using it in your own projects requires our written permission; email [hello@cadogy.com](mailto:hello@cadogy.com) to ask.

Photography credits are in [docs/IMAGE_CREDITS.md](docs/IMAGE_CREDITS.md).
