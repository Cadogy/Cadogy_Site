export type Service = {
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly detail: string
  readonly includes: readonly string[]
  readonly image: string
  readonly featured: boolean
}

export type ProcessStep = { readonly title: string; readonly body: string }
export type Principle = { readonly title: string; readonly body: string }
export type EngagementModel = { readonly title: string; readonly body: string }

export type CaseStudy = {
  readonly slug: string
  readonly name: string
  readonly url: string
  readonly category: string
  readonly summary: string
  readonly role: string
  readonly image: string
  readonly mobileImage: string
  readonly challenge: readonly string[]
  readonly promises: readonly string[]
  readonly facts: readonly { readonly value: string; readonly label: string }[]
  readonly orderFlow: readonly CaseStudyPoint[]
  readonly chapters: readonly {
    readonly title: string
    readonly intro: string
    readonly points: readonly CaseStudyPoint[]
  }[]
  readonly stack: readonly string[]
}

type CaseStudyPoint = { readonly title: string; readonly body: string }

export const hero = {
  title: "We can build anything.",
  accent: "And we stand behind it.",
  lead: "Cadogy is a senior software studio. We design, build and run the products, platforms and systems businesses depend on, with the pace of a startup and the standards of an enterprise team.",
  primaryCta: { label: "Start a project", href: "/contact" },
  secondaryCta: { label: "See our work", href: "/work" },
} as const

export const statement = {
  lead: "Senior engineers, start to finish.",
  rest: "The people you talk to are the people building your product, so decisions are fast, nothing gets lost in handoffs, and every change is designed, reviewed and tested by someone accountable for it.",
} as const

export const services: readonly Service[] = [
  {
    slug: "product-engineering",
    title: "Product engineering",
    summary:
      "Web apps, SaaS platforms and marketplaces, from first commit to production.",
    detail:
      "We take products from idea to launch and keep improving them after. You get a typed, tested codebase you own outright, built by people who have already solved the problems you're about to hit.",
    includes: [
      "Next.js and React front ends",
      "APIs, background jobs and real-time features",
      "Two-sided marketplaces and multi-tenant SaaS",
      "Admin, moderation and internal tooling",
    ],
    image: "/images/studio/product-engineering.webp",
    featured: true,
  },
  {
    slug: "payments",
    title: "Payments & commerce",
    summary:
      "Checkout, payouts, escrow, subscriptions and invoicing built for real money.",
    detail:
      "Payments are where small mistakes get expensive. We design money flows with idempotency, reconciliation and audit trails from day one, because we run them in production ourselves.",
    includes: [
      "Stripe integrations and webhooks",
      "Escrow, wallets and seller payouts",
      "Subscriptions and invoicing",
      "Fraud, disputes and reconciliation",
    ],
    image: "/images/studio/payments.webp",
    featured: true,
  },
  {
    slug: "ai",
    title: "AI integration",
    summary:
      "Practical AI features and automation that do real work inside your product and operations.",
    detail:
      "We add AI where it earns its place: features your customers use, and automation that removes manual work from your team. Every feature ships with evaluation, guardrails and cost controls.",
    includes: [
      "Assistants, search and summarization",
      "Workflow automation",
      "Document and data extraction",
      "Evaluation, guardrails and cost control",
    ],
    image: "/images/studio/ai-integration.webp",
    featured: true,
  },
  {
    slug: "infrastructure",
    title: "Infrastructure & security",
    summary: "Fast, secure, observable systems you don't have to babysit.",
    detail:
      "We harden what you have or build it right the first time: authentication, access control, edge security, performance and monitoring, so problems surface before your customers notice them.",
    includes: [
      "Authentication and access control",
      "Cloudflare, Vercel and AWS",
      "Performance, Core Web Vitals and SEO",
      "Monitoring, alerting and incident response",
    ],
    image: "/images/studio/infrastructure.webp",
    featured: false,
  },
]

export const processSteps: readonly ProcessStep[] = [
  {
    title: "Specify",
    body: "We turn your goals into a written specification with clear scope, milestones and acceptance criteria. You know exactly what you're getting before we write code.",
  },
  {
    title: "Build",
    body: "We ship in small, tested increments you can review every week. Senior engineers make every decision and review every change before it ships.",
  },
  {
    title: "Run",
    body: "We launch, monitor and keep improving what we build. We operate our own products the same way, so production is where we're most at home.",
  },
]

export const principles: readonly Principle[] = [
  {
    title: "You work with the engineers",
    body: "No account managers or handoffs. The people you talk to are the people writing your code.",
  },
  {
    title: "Speed without shortcuts",
    body: "We move quickly because our process is tight, not because we cut corners. Every change is reviewed and tested before it ships.",
  },
  {
    title: "Built to last",
    body: "Typed, tested and documented code that you own outright and any good engineer can pick up.",
  },
  {
    title: "Proven in production",
    body: "We build and run our own marketplace, so we know what real traffic, real money and real users demand.",
  },
]

export const engagementModels: readonly EngagementModel[] = [
  {
    title: "Fixed-scope projects",
    body: "A defined outcome, a written spec and a delivery schedule. Best for new products, rebuilds and well-understood features.",
  },
  {
    title: "Ongoing partnership",
    body: "A monthly engagement for teams that need senior engineering capacity: new features, maintenance and technical leadership.",
  },
  {
    title: "Technical advisory",
    body: "Architecture reviews, security and performance audits, and a second opinion before you commit to a big decision.",
  },
]

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "playerbay",
    name: "PlayerBay",
    url: "https://playerbay.com",
    category: "Marketplace",
    summary:
      "A two-sided marketplace where players buy and sell game accounts, items, in-game currency, keys and top-ups, with buyer protection on every order and a storefront in 25 languages.",
    role: "Product, engineering and operations — designed, built and run in-house.",
    image: "/images/studio/playerbay-case-study.webp",
    mobileImage: "/images/studio/playerbay-case-study-mobile.webp",
    challenge: [
      "Digital-goods marketplaces live or die on trust. Buyers need to know they'll receive what they paid for, sellers need to know they'll get paid, and the platform has to resolve problems fairly when something goes wrong.",
      "Digital goods are also hard to protect. There's no tracking number for a game account, delivery can take seconds or hours depending on the game, and stolen cards are a constant risk. Every rule has to be easy for honest buyers and sellers without opening a door for fraud.",
      "PlayerBay needed the full machinery of a modern marketplace — listings, checkout, payouts, messaging and disputes — built to handle real money from day one, for players all over the world.",
    ],
    promises: [
      "Paid only when you confirm",
      "Late delivery? Automatic refund",
      "Every seller verifies their ID",
      "Human support, 24/7",
    ],
    facts: [
      { value: "25", label: "Languages" },
      { value: "10", label: "Currencies" },
      { value: "6", label: "Ways to pay" },
      { value: "6", label: "Payout methods" },
      { value: "2,100+", label: "Automated test files" },
    ],
    orderFlow: [
      {
        title: "Checkout",
        body: "The buyer pays by card, Apple Pay, Google Pay, Amazon Pay, Cash App or crypto. Stock is reserved the moment checkout starts, so two people can't buy the last item.",
      },
      {
        title: "Payment confirmed",
        body: "The payment event is verified at the edge, queued and processed exactly once. Riskier payments pause automatic delivery for a closer look.",
      },
      {
        title: "Delivery",
        body: "Instant listings deliver automatically. Others are delivered by the seller in the order chat. Account details are encrypted, and every time they're viewed is logged.",
      },
      {
        title: "Protection period",
        body: "The buyer checks what they received while the money stays held. The protection period is set per game and category, and fixed on the order when it's placed.",
      },
      {
        title: "Received",
        body: "The buyer confirms receipt, or the order completes on its own when protection ends. Only then is the sale credited to the seller.",
      },
      {
        title: "Payout",
        body: "Sellers withdraw their balance through Payoneer, SEPA, SWIFT, Skrill, Bitcoin or USDC.",
      },
    ],
    chapters: [
      {
        title: "Trust and safety",
        intro:
          "Every promise on the storefront is enforced in code, not left to policy.",
        points: [
          {
            title: "Money held until delivery",
            body: "A seller is credited only after the buyer confirms receipt or the protection period ends. A sale can be held while a dispute or chargeback is open.",
          },
          {
            title: "Structured disputes",
            body: "Dispute reasons depend on what was bought. Both sides get clear deadlines to respond and add evidence, sellers can offer a partial refund or a replacement, and deadlines are enforced automatically around the clock.",
          },
          {
            title: "Layered fraud controls",
            body: "Payment risk scores, purchase velocity and device signals decide whether an order delivers instantly or waits for review. Chargebacks and early fraud warnings flow straight into the order.",
          },
          {
            title: "Verified sellers",
            body: "Sellers verify their identity before they can sell, as an individual or a company, including details of who owns the business.",
          },
          {
            title: "Deals stay on the platform",
            body: "Order chat blocks attempts to move a trade elsewhere, including email addresses and handles disguised with look-alike or hidden characters.",
          },
          {
            title: "Modern sign-in",
            body: "Passkeys, two-factor authentication, breached-password checks and one-click sign-in with Google, Discord, Facebook or Steam.",
          },
        ],
      },
      {
        title: "Money and payments",
        intro:
          "Balances, fees and payouts are handled like the real money they are.",
        points: [
          {
            title: "A ledger, not a balance field",
            body: "Every change to a wallet or seller balance is a ledger entry written in a database transaction with its own idempotency key. Replaying an event changes nothing.",
          },
          {
            title: "Webhooks at the edge",
            body: "Payment events are verified by Cloudflare Workers, queued and processed once. Events that fail are kept so they can be replayed safely.",
          },
          {
            title: "Terms fixed at checkout",
            body: "Fee rates and the protection period are captured on each order when it's placed, so later changes never rewrite past sales.",
          },
          {
            title: "Daily reconciliation",
            body: "A daily check reads through the ledger looking for anything that doesn't add up, and records what it finds for the team to review.",
          },
          {
            title: "Many ways to pay and get paid",
            body: "Cards and wallets through Stripe, crypto through NOWPayments, and six payout methods so sellers can be paid wherever they are.",
          },
          {
            title: "Rewards for buyers",
            body: "Buyers earn part of every purchase back as wallet credit they can spend on their next order.",
          },
        ],
      },
      {
        title: "Tools for sellers",
        intro:
          "Selling a hundred listings should take about as much effort as selling one.",
        points: [
          {
            title: "Listing at scale",
            body: "Drafts, bulk upload and editing from spreadsheets, exports, and bulk changes across many listings at once.",
          },
          {
            title: "Instant delivery",
            body: "Pools of game keys and gift-card codes, and accounts set up for automatic delivery, go out the moment payment clears.",
          },
          {
            title: "Fees that reward growth",
            body: "Seller fees step down in tiers as monthly sales grow, with a founding-seller program for early sellers.",
          },
          {
            title: "A real-time inbox",
            body: "Live chat per order with presence, reactions, attachments and edits, plus email digests of unread messages.",
          },
        ],
      },
      {
        title: "Running the marketplace",
        intro:
          "A small team can run a large marketplace when the tools do the routine work.",
        points: [
          {
            title: "One admin for everything",
            body: "Around 50 admin areas cover users, seller verification, orders, disputes, finance, withdrawals, the game catalog, campaigns, SEO and translations.",
          },
          {
            title: "Accountable staff access",
            body: "Staff roles have named permissions. Sensitive actions need a fresh identity check, personal data is masked by default, and every staff action is recorded in an audit log.",
          },
          {
            title: "AI-assisted review",
            body: "Suspicious orders and accounts are summarized for reviewers with an AI assessment, and imported products are enriched automatically, so staff spend their time on decisions.",
          },
          {
            title: "Work that runs itself",
            body: "Scheduled jobs enforce dispute deadlines, release held deliveries, complete orders when protection ends and send reminders, on Vercel Cron and Cloudflare Workers.",
          },
        ],
      },
      {
        title: "A global storefront",
        intro:
          "Players find PlayerBay in their own language, and pay in their own currency.",
        points: [
          {
            title: "25 languages, 10 currencies",
            body: "Every page is localized, with clean URLs (English has no prefix) and hreflang tags that match the sitemap exactly.",
          },
          {
            title: "Built to be found",
            body: "Per-language sitemaps, structured data for products, ratings and FAQs, a Google Merchant feed, and IndexNow so search engines hear about changes quickly.",
          },
          {
            title: "Search that understands players",
            body: "Full-text search across games and listings, with an AI-assisted mode for questions asked in plain language.",
          },
          {
            title: "Fast on every connection",
            body: "Cached pages, and images served as AVIF and WebP from PlayerBay's own CDN.",
          },
        ],
      },
      {
        title: "Engineering quality",
        intro:
          "A codebase this size stays healthy only if it's easy to change safely.",
        points: [
          {
            title: "Rules you can test",
            body: "Order, payment and dispute rules are pure functions with their own tests. Over 2,100 test files cover the platform, including tests that walk whole dispute flows from start to finish.",
          },
          {
            title: "A modular monolith",
            body: "38 feature modules with clear boundaries — orders, payments, messaging, sellers and more — in one deployable app, plus a separate real-time server.",
          },
          {
            title: "Hardened by default",
            body: "Strict security headers, sanitized rich text, private file storage with signed links, bot protection on sign-up and sign-in, and rate limits that hold across servers.",
          },
          {
            title: "Watched in production",
            body: "Error tracking, product analytics and real-user performance monitoring show problems before players report them.",
          },
        ],
      },
    ],
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "MongoDB Atlas",
      "Better Auth",
      "Stripe",
      "NOWPayments",
      "Socket.IO",
      "Cloudflare Workers",
      "Cloudflare R2",
      "Redis",
      "Resend",
      "PostHog",
      "Sentry",
      "Vercel",
    ],
  },
]

export const contactCta = {
  title: "Have something to build?",
  body: "Tell us what you're working on. You'll hear back directly from one of the founders.",
  cta: { label: "Start a project", href: "/contact" },
} as const

export type Faq = { readonly question: string; readonly answer: string }

export const faqs: readonly Faq[] = [
  {
    question: "What does Cadogy do?",
    answer:
      "Cadogy is a senior software studio based in South Florida. We design, build and run production software: web applications, SaaS platforms, marketplaces, payment systems, AI features and the infrastructure underneath them.",
  },
  {
    question: "What kinds of projects do you take on?",
    answer:
      "New products built from scratch, rebuilds of existing platforms, payments and commerce work, AI integrations, and security or performance improvements. If it runs on the web, we can build it.",
  },
  {
    question: "How does a project start?",
    answer:
      "You tell us what you're building through our contact form. One of the founders replies personally, we have a short call to understand your goals, and then you receive a written proposal with scope, timeline and cost.",
  },
  {
    question: "How do you price projects?",
    answer:
      "Most projects are fixed-scope: a written specification with a clear price and delivery schedule, agreed before work starts. Ongoing work and support are billed monthly.",
  },
  {
    question: "Do we own the code you write?",
    answer:
      "Yes. You own the code we write for you outright. It's typed, tested and documented so any good engineer can pick it up.",
  },
  {
    question: "Can you work with our existing codebase or team?",
    answer:
      "Yes. We regularly take over, harden and extend existing products, and we work alongside in-house teams when that's the best fit.",
  },
  {
    question: "Do you support software after launch?",
    answer:
      "Yes. We monitor, maintain and keep improving what we build. We run our own production marketplace the same way, so ongoing operations are part of how we work, not an afterthought.",
  },
  {
    question: "Where are you located?",
    answer:
      "We're based in South Florida and work with clients across the United States and internationally.",
  },
]
