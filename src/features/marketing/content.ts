import type { Video } from "@/components/media/video-embed"

export type Service = {
  readonly slug: string
  readonly title: string
  readonly summary: string
  readonly detail: string
  readonly includes: readonly string[]
  readonly capture: {
    readonly image: string
    readonly alt: string
    readonly span: "wide" | "narrow"
  }
  readonly tone: "--brand" | "--success" | "--violet" | "--warning"
}

export type ProcessStep = {
  readonly title: string
  readonly body: string
  readonly example: { readonly image: string; readonly alt: string }
}
export type Principle = { readonly title: string; readonly body: string }

export type CaseStudy = {
  readonly slug: string
  readonly name: string
  readonly website?: string
  readonly links: readonly string[]
  readonly category: string
  readonly summary: string
  readonly role: string
  readonly image: string
  readonly mobileImage: string
  readonly imageAlt: string
  readonly video?: Video
  readonly hero: { readonly image: string; readonly focus: string }
  readonly story: {
    readonly headline: string
    readonly tone: "playerbay" | "sidecar"
    readonly image?: string
  }
  readonly challenge: readonly string[]
  readonly productLabel: string
  readonly promisesHeading: { readonly lead: string; readonly rest: string }
  readonly promises: readonly string[]
  readonly facts: readonly { readonly value: string; readonly label: string }[]
  readonly factsSource: string
  readonly flow: {
    readonly title: string
    readonly intro: string
    readonly steps: readonly CaseStudyPoint[]
  }
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
  imageAlt:
    "PlayerBay's storefront, the marketplace we built and run: popular games, buyer protections and recently viewed listings",
  news: {
    label: "Sidecar for OpenCode case study",
    href: "/work/opencode-sidecar",
  },
} as const

export const statement = {
  lead: "Senior engineers, start to finish.",
  sentences: [
    {
      before: "The people you talk to are ",
      key: "the people building your product",
      after: ".",
    },
    { before: "Decisions are ", key: "fast", after: "." },
    { before: "Nothing gets ", key: "lost in handoffs", after: "." },
    {
      before: "Every change is designed, reviewed and tested by someone ",
      key: "accountable for it",
      after: ".",
    },
  ],
} as const

export const services: readonly Service[] = [
  {
    slug: "product-engineering",
    tone: "--brand",
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
    capture: {
      image: "/images/studio/playerbay-storefront.webp",
      alt: "PlayerBay, the marketplace we built and run, showing popular games and recently viewed listings",
      span: "wide",
    },
  },
  {
    slug: "payments",
    tone: "--success",
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
    capture: {
      image: "/images/studio/service-payments.webp",
      alt: "An invoice from Cadogy's own billing system, filled with sample data",
      span: "narrow",
    },
  },
  {
    slug: "ai",
    tone: "--violet",
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
    capture: {
      image: "/images/studio/service-ai.webp",
      alt: "Sidecar for OpenCode asking permission before an AI agent runs a shell command",
      span: "narrow",
    },
  },
  {
    slug: "infrastructure",
    tone: "--warning",
    title: "Infrastructure & security",
    summary:
      "Auth, edge security, performance and monitoring that catch problems before customers do.",
    detail:
      "We harden what you have or build it right the first time: authentication, access control, edge security, performance and monitoring, so problems surface before your customers notice them.",
    includes: [
      "Authentication and access control",
      "Cloudflare, Vercel and AWS",
      "Performance, Core Web Vitals and SEO",
      "Monitoring, alerting and incident response",
    ],
    capture: {
      image: "/images/studio/service-infrastructure.webp",
      alt: "Terminal output of cadogy.com's response headers: strict transport security, content security policy and frame protection",
      span: "wide",
    },
  },
]

export const processSteps: readonly ProcessStep[] = [
  {
    title: "Specify",
    body: "We turn your goals into a written spec with clear scope, milestones and acceptance criteria, so you know what you get before we write code.",
    example: {
      image: "/images/studio/process-specify.webp",
      alt: "An excerpt from one of our specifications: the business rules for invoicing, each backed by a test",
    },
  },
  {
    title: "Build",
    body: "We ship in small, tested increments you can review every week. Senior engineers make every decision and review every change before it ships.",
    example: {
      image: "/images/studio/process-build.webp",
      alt: "A real test run of our billing code: 227 tests passing, including the invoice lifecycle rules",
    },
  },
  {
    title: "Run",
    body: "We launch, monitor and keep improving what we build. We operate our own products the same way, so production is where we're most at home.",
    example: {
      image: "/images/studio/process-run.webp",
      alt: "The public changelog of Sidecar for OpenCode, listing the improvements in each release since launch",
    },
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

export const waysToWork = {
  options: [
    { id: "fixed", title: "Fixed-scope projects", note: "Most projects" },
    { id: "partnership", title: "Ongoing partnership" },
    { id: "advisory", title: "Technical advisory" },
  ],
  rows: [
    {
      topic: "Best for",
      values: [
        "New products, rebuilds and well-understood features",
        "Teams that need senior engineering capacity every month",
        "A second opinion before you commit to a big decision",
      ],
    },
    {
      topic: "What you get",
      values: [
        "A written spec, a delivery schedule and software you own outright",
        "New features, maintenance and technical leadership",
        "Architecture reviews and security and performance audits",
      ],
    },
    {
      topic: "How it's priced",
      values: [
        "One clear price, agreed before work starts",
        "Billed monthly",
        "Quoted in a written proposal before we start",
      ],
    },
  ],
  highlight: "fixed",
} as const

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "playerbay",
    name: "PlayerBay",
    website: "https://playerbay.com",
    links: [],
    category: "Marketplace",
    summary:
      "A two-sided marketplace where players buy and sell game accounts, items, in-game currency, keys and top-ups, with buyer protection on every order and a storefront in 25 languages.",
    role: "Product, engineering and operations — designed, built and run in-house.",
    image: "/images/studio/playerbay.webp",
    mobileImage: "/images/studio/playerbay-mobile.webp",
    hero: {
      image: "/images/studio/playerbay-storefront.webp",
      focus: "object-left-top",
    },
    imageAlt: "PlayerBay marketplace homepage",
    story: {
      headline: "A marketplace we built and run, in 25 languages.",
      tone: "playerbay",
      image: "/images/studio/playerbay-storefront.webp",
    },
    challenge: [
      "Digital-goods marketplaces live or die on trust. Buyers need to know they'll receive what they paid for, sellers need to know they'll get paid, and the platform has to resolve problems fairly when something goes wrong.",
      "Digital goods are also hard to protect. There's no tracking number for a game account, delivery can take seconds or hours depending on the game, and stolen cards are a constant risk. Every rule has to be easy for honest buyers and sellers without opening a door for fraud.",
      "PlayerBay needed the full machinery of a modern marketplace — listings, checkout, payouts, messaging and disputes — built to handle real money from day one, for players all over the world.",
    ],
    productLabel: "Live product",
    promisesHeading: {
      lead: "What buyers are promised",
      rest: "— and what the platform has to guarantee behind the scenes.",
    },
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
      { value: "7", label: "Payout methods" },
      { value: "3,200+", label: "Automated test files" },
    ],
    factsSource: "Counted from PlayerBay's production code and configuration.",
    flow: {
      title: "How an order works",
      intro:
        "From checkout to payout, every step is designed so neither side has to trust the other.",
      steps: [
        {
          title: "Checkout",
          body: "Card, wallets or crypto. Stock is reserved the moment checkout starts, so the last item can't sell twice.",
        },
        {
          title: "Payment confirmed",
          body: "Verified at the edge and processed exactly once. Riskier payments pause delivery for a closer look.",
        },
        {
          title: "Delivery",
          body: "Instant listings deliver automatically, others through the order chat. Account details are encrypted.",
        },
        {
          title: "Protection period",
          body: "The buyer checks the goods while the money stays held, for a period set per game and category.",
        },
        {
          title: "Received",
          body: "The buyer confirms, or the order completes when protection ends. Only then is the seller credited.",
        },
        {
          title: "Payout",
          body: "Sellers withdraw through PayPal, Payoneer, SEPA, SWIFT, Skrill, Bitcoin or USDC.",
        },
      ],
    },
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
            body: "Dispute reasons fit what was bought. Both sides get deadlines and evidence, sellers can offer a refund or replacement, and it's all enforced automatically.",
          },
          {
            title: "Layered fraud controls",
            body: "Risk scores, purchase velocity and device signals decide whether an order delivers instantly or waits for review. Chargebacks land on the order.",
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
            body: "Every balance change is a ledger entry written in a transaction with its own idempotency key. Replaying an event changes nothing.",
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
            body: "Cards and wallets through Stripe, crypto through NOWPayments, and seven payout methods so sellers can be paid wherever they are.",
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
            body: "Named permissions per role. Sensitive actions need a fresh identity check, personal data is masked, and every action is audit-logged.",
          },
          {
            title: "AI-assisted review",
            body: "Suspicious orders and accounts arrive summarized with an AI assessment, and imports are enriched automatically, so staff spend time on decisions.",
          },
          {
            title: "Work that runs itself",
            body: "Scheduled jobs enforce deadlines, release held deliveries, complete orders and send reminders, on Vercel Cron and Cloudflare Workers.",
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
            body: "Per-language sitemaps, structured data, a Google Merchant feed and IndexNow, so search engines hear about changes quickly.",
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
            body: "Order, payment and dispute rules are pure, tested functions. Over 3,200 test files cover the platform, including whole dispute flows.",
          },
          {
            title: "A modular monolith",
            body: "41 feature modules with clear boundaries — orders, payments, messaging, sellers and more — in one deployable app, plus a separate real-time server.",
          },
          {
            title: "Hardened by default",
            body: "Strict security headers, sanitized rich text, signed links to private files, bot protection on sign-in and rate limits across servers.",
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
  {
    slug: "opencode-sidecar",
    name: "Sidecar for OpenCode",
    website: "https://www.opencodesidecar.com",
    links: [
      "https://marketplace.visualstudio.com/items?itemName=cadogy.opencode-sidecar",
      "https://github.com/charlesknapp/opencode-sidecar",
    ],
    category: "Developer tool",
    summary:
      "A free, open-source VS Code extension that puts the OpenCode coding agent in a chat panel beside your code, with every step on one timeline and nothing approved without you.",
    role: "Product, design and engineering — built, released and maintained by Cadogy under the MIT license.",
    image: "/images/studio/sidecar.webp",
    mobileImage: "/images/studio/sidecar-mobile.webp",
    hero: {
      image: "/images/studio/sidecar-story.webp",
      focus: "object-[50%_22%]",
    },
    story: {
      headline: "OpenCode, in a panel beside your code.",
      tone: "sidecar",
      image: "/images/studio/sidecar-story.webp",
    },
    imageAlt:
      "Sidecar for OpenCode in VS Code: a timeline of the agent's steps, live subagents and a permission request",
    video: {
      youtubeId: "_KMBRo7zrMw",
      title:
        "Sidecar for OpenCode: the OpenCode chat sidebar for VS Code (free extension)",
      poster: "/images/studio/sidecar-video.webp",
    },
    challenge: [
      "OpenCode is a capable open-source coding agent that runs in the terminal. Its official VS Code extension opens that terminal interface in a split pane. We wanted a graphical chat panel that shows everything the agent does and keeps the developer in charge, without leaving the editor.",
      "An agent that reads files and runs commands has to be watched. Every tool call, subagent and permission request needs to be visible and answerable without breaking flow, and nothing can be approved behind the developer's back.",
      "It also had to respect how OpenCode works: no lock-in, no separate account and no service of our own. A session started in Sidecar continues in OpenCode's terminal interface, and the other way around.",
    ],
    productLabel: "Get the extension",
    promisesHeading: {
      lead: "What developers are promised",
      rest: "— and what the extension has to guarantee behind the scenes.",
    },
    promises: [
      "Nothing approved for you",
      "Every step on one timeline",
      "No telemetry, no service of ours",
      "Your sessions stay OpenCode's",
    ],
    facts: [
      { value: "414", label: "Unit tests" },
      { value: "99", label: "Headless-browser tests" },
      { value: "4", label: "Editors supported" },
      { value: "None", label: "Telemetry" },
      { value: "MIT", label: "Open-source license" },
    ],
    factsSource:
      "Counted from Sidecar's source code and its test runs at version 0.1.4.",
    flow: {
      title: "How a prompt works",
      intro:
        "From the message box to the diff, every step stays visible and under your control.",
      steps: [
        {
          title: "Prompt",
          body: "Type with @ mentions, pasted screenshots and / commands. It goes to OpenCode running on your machine.",
        },
        {
          title: "Timeline",
          body: "Every step appears as it happens: thinking time, each tool call with its input and output, and edits.",
        },
        {
          title: "Subagents",
          body: "Each subagent gets a live row with its activity, Stop and Open. Its report comes back as one line.",
        },
        {
          title: "Permissions",
          body: "Approval requests, even from deep inside a subagent, take the message box's place until you answer.",
        },
        {
          title: "Steer or queue",
          body: "Steer the running task or queue the next message. Budget Guard stops runaway tasks at your limit.",
        },
        {
          title: "Review",
          body: "Edits open in VS Code's diff editor, apart from yours. Rewind or fork from any prompt to try again.",
        },
      ],
    },
    chapters: [
      {
        title: "Visibility and control",
        intro: "You see every step, and the agent never acts without you.",
        points: [
          {
            title: "One timeline per prompt",
            body: "A dot per step: text, thinking time, every tool call and every subagent. The prompt you're reading stays pinned while you scroll.",
          },
          {
            title: "Answer where you type",
            body: "Permission requests replace the message box until answered, with numbered choices or new instructions. Sensitive paths get a warning.",
          },
          {
            title: "Budget Guard",
            body: "A per-task limit on cost and steps. It warns at 80%, then stops the agent through OpenCode's own cancellation.",
          },
          {
            title: "Agent changes kept apart",
            body: "The agent's edits come from OpenCode's snapshots, so yours aren't counted. When they can't be told apart, Sidecar says so.",
          },
          {
            title: "Rewind and fork",
            body: "Rewind a session to just before any prompt, with or without its code changes, or fork from that point into a new session and keep the original.",
          },
          {
            title: "Notifications that say why",
            body: "Native notifications when a task completes, needs input, fails or is stopped, and a count on the icon for answers waiting while the panel is hidden.",
          },
        ],
      },
      {
        title: "Built on OpenCode, not around it",
        intro:
          "Sidecar is a thin interface. OpenCode stays the engine and the source of truth.",
        points: [
          {
            title: "OpenCode's own API",
            body: "Sidecar uses OpenCode 2's v2 HTTP API and live event stream. Sessions, models, agents, skills and permission rules stay OpenCode's.",
          },
          {
            title: "Followed live",
            body: "New sessions, renames, rewinds, agent and model changes made in OpenCode's terminal interface or another window show up in Sidecar as they happen.",
          },
          {
            title: "One adapter boundary",
            body: "Everything that talks to OpenCode goes through a single client interface, so another transport could replace it without touching the interface.",
          },
          {
            title: "Setup that disappears",
            body: "A setup card offers Install, Start and Sign in to OpenCode when something is missing, and goes away once everything is ready.",
          },
        ],
      },
      {
        title: "Private and secure by design",
        intro:
          "An extension that watches an agent at work shouldn't become another thing to watch.",
        points: [
          {
            title: "Local only",
            body: "Sidecar connects only to your local OpenCode service, on loopback unless you allow a remote one. It has no telemetry and no service of its own.",
          },
          {
            title: "No credentials",
            body: "Sign-in stays with OpenCode. The service password lives in memory, and files are sent only when you attach them or the agent reads them.",
          },
          {
            title: "A locked-down view",
            body: "A strict content security policy with a per-load nonce, validated messages, and logs that leave out prompts and redact secrets.",
          },
          {
            title: "Trusted workspaces only",
            body: "Because OpenCode can read files and run commands, Sidecar is disabled in VS Code's Restricted Mode.",
          },
        ],
      },
      {
        title: "Engineering quality",
        intro: "Built to be changed safely, and tested against the real thing.",
        points: [
          {
            title: "Layers that test in plain Node",
            body: "The session controller, transcript, adapter and shared model don't depend on VS Code, so most behavior runs in 414 fast unit tests.",
          },
          {
            title: "The real interface, in a real browser",
            body: "99 click-through tests drive the production chat bundle in headless Chrome, with VS Code's messaging reproduced exactly.",
          },
          {
            title: "Acceptance against live OpenCode",
            body: "Scenarios run in isolated VS Code windows against real OpenCode. A read-only run checks the repository is byte-for-byte unchanged.",
          },
          {
            title: "Native to VS Code",
            body: "Theme colors only, in dark, light and high-contrast themes, a layout from a 300 px side bar to a full tab, and full keyboard access.",
          },
        ],
      },
      {
        title: "Shipping it",
        intro: "One build, published everywhere VS Code runs.",
        points: [
          {
            title: "One release workflow",
            body: "A tagged release builds the extension once and publishes the same package to GitHub Releases, the Visual Studio Marketplace and Open VSX.",
          },
          {
            title: "Trusted publishing",
            body: "The Marketplace release authenticates with short-lived OpenID Connect credentials from GitHub Actions instead of a stored access token.",
          },
          {
            title: "Every VS Code editor",
            body: "VS Code installs it from the Marketplace. Cursor, Windsurf and VSCodium install it from Open VSX.",
          },
          {
            title: "Five releases in two days",
            body: "Versions 0.1.0 through 0.1.4 shipped in the first two days after launch, each with its changes in the changelog.",
          },
        ],
      },
    ],
    stack: [
      "TypeScript",
      "VS Code Extension API",
      "Webviews",
      "OpenCode v2 API",
      "Server-sent events",
      "esbuild",
      "Node.js test runner",
      "Puppeteer",
      "GitHub Actions",
      "Open VSX",
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

export const displayHost = (url: string) =>
  new URL(url).host.replace(/^www\./, "")

const PROOF = [
  ["playerbay", "Automated test files", "test files"],
  ["playerbay", "Languages", "languages"],
  ["playerbay", "Currencies", "currencies"],
  ["opencode-sidecar", "Unit tests", "unit tests"],
  ["opencode-sidecar", "Headless-browser tests", "browser tests"],
  ["opencode-sidecar", "Editors supported", "editors"],
] as const

export const proofFigures = PROOF.flatMap(([slug, label, short]) => {
  const study = caseStudies.find((candidate) => candidate.slug === slug)
  const fact = study?.facts.find((candidate) => candidate.label === label)
  return study && fact
    ? [{ value: fact.value, label, short, study: { name: study.name, slug } }]
    : []
})
