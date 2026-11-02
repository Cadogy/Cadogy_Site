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
  readonly capabilities: readonly {
    readonly title: string
    readonly body: string
  }[]
  readonly stack: readonly string[]
}

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
      "A two-sided marketplace for in-game items, accounts and currency, with buyer protection built into every order.",
    role: "Product, engineering and operations — designed, built and run in-house.",
    image: "/images/studio/playerbay-case-study.webp",
    mobileImage: "/images/studio/playerbay-case-study-mobile.webp",
    challenge: [
      "Digital-goods marketplaces live or die on trust. Buyers need to know they'll receive what they paid for, sellers need to know they'll get paid, and the platform has to resolve problems fairly when something goes wrong.",
      "PlayerBay needed the full machinery of a modern marketplace — listings, checkout, payouts, messaging and disputes — built to handle real money from day one.",
    ],
    promises: [
      "Paid only when you confirm",
      "Late delivery? Automatic refund",
      "Every seller verifies their ID",
      "Human support, 24/7",
    ],
    capabilities: [
      {
        title: "Escrow-style buyer protection",
        body: "Funds are held until the buyer confirms delivery, with clear rules for release, refunds and disputes.",
      },
      {
        title: "Payments and seller payouts",
        body: "Card checkout, seller balances and payouts with idempotent processing and a full audit trail.",
      },
      {
        title: "Real-time messaging",
        body: "Live order chat between buyers and sellers so deliveries happen quickly and on the record.",
      },
      {
        title: "Disputes and moderation",
        body: "Structured dispute workflows and admin tooling so the team can resolve issues quickly and consistently.",
      },
      {
        title: "Multi-language storefront",
        body: "Localized routes and content so buyers and sellers can trade in their own language and currency.",
      },
      {
        title: "Production operations",
        body: "Monitoring, error tracking, edge security and analytics so the platform stays fast and available.",
      },
    ],
    stack: [
      "Next.js",
      "TypeScript",
      "Node.js",
      "MongoDB",
      "Redis",
      "Socket.IO",
      "Stripe",
      "Cloudflare",
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
