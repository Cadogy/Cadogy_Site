import { siteConfig } from "@/config/site"
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
  readonly status?: string
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
    readonly tone:
      "playerbay" | "sidecar" | "graceful-era" | "disciples" | "oden"
    readonly image?: string
    /** How the story card crops its image, e.g. "object-right-top". */
    readonly focus?: string
  }
  /** The situation, as prose. The first paragraph is set large. */
  readonly challenge: readonly string[]
  readonly productLabel: string
  /** Short promises shown on the story cards. */
  readonly promises: readonly string[]
  /** Verifiable figures, used in llms.txt and the proof strips, not the story. */
  readonly facts: readonly { readonly value: string; readonly label: string }[]
  readonly factsSource: string
  readonly flow: {
    readonly title: string
    readonly intro: string
    readonly steps: readonly CaseStudyPoint[]
  }
  /** The story itself: what was built and why, a few paragraphs each. */
  readonly chapters: readonly {
    readonly title: string
    readonly paragraphs: readonly string[]
  }[]
  /** One line, in our words, set large between chapters. */
  readonly pullLine: string
  /** Where the project stands now. */
  readonly outcome: {
    readonly title: string
    readonly paragraphs: readonly string[]
  }
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
      "A marketplace where players buy and sell game accounts, items, in-game currency and keys, with the buyer's money held until the goods arrive. We designed it, built it and run it, in 25 languages.",
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
      "When you buy a game account from a stranger, there's no tracking number and no box on the doorstep. All you have is the platform's word that it'll be handled fairly.",
      "PlayerBay is our own marketplace for game accounts, items, in-game currency, keys and top-ups. We started planning it in late 2024 around one idea: buyers and sellers who will never meet shouldn't have to trust each other, because the platform does the trusting for them.",
      "Digital goods make that hard. Delivery can take seconds or hours depending on the game. Stolen cards turn up constantly, because a game key is easy to resell. And every rule that keeps fraud out has to stay out of the way of honest buyers and sellers, or they'll trade somewhere else.",
    ],
    productLabel: "Live product",
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
        "From checkout to payout, the money waits in the middle until both sides have what they were promised.",
      steps: [
        {
          title: "Checkout",
          body: "The buyer pays by card, wallet or crypto. Stock is reserved as checkout starts, so the last item can't sell twice.",
        },
        {
          title: "Payment confirmed",
          body: "The payment is checked against the amount the server worked out itself. Riskier orders pause for a closer look.",
        },
        {
          title: "Delivery",
          body: "Keys and codes go out automatically. Everything else is handed over in the order chat, with account details encrypted.",
        },
        {
          title: "Protection period",
          body: "The buyer checks what they received while the money stays held, for a period set by game and type of item.",
        },
        {
          title: "Completed",
          body: "The buyer confirms, or the protection period ends without a problem. Only then is the seller credited.",
        },
        {
          title: "Payout",
          body: "Sellers withdraw through PayPal, Payoneer, SEPA, SWIFT, Skrill, Bitcoin or USDC.",
        },
      ],
    },
    chapters: [
      {
        title: "Holding the money in the middle",
        paragraphs: [
          "The core promise is simple: a seller isn't paid until the buyer has what they paid for. When an order is placed, the money is held. The buyer gets a protection period, set per game and type of item, to check the goods. When they confirm, or the period ends quietly, the seller is credited.",
          "The details are what make the promise hold. Fees, the protection period and the promised delivery time are frozen onto each order at checkout, so a change we make in the admin next week never rewrites a sale already under way. Even the delivery time depends on whether the seller was online when the order came in, so the promise the buyer saw is the one the seller is held to.",
          "When something goes wrong, opening a dispute holds the seller's earnings in place. A refund releases them at once. If the seller turns out to be in the right, they're released when the protection window closes, not before, so nobody can withdraw money that might still have to go back.",
        ],
      },
      {
        title: "Treating balances like money",
        paragraphs: [
          "Early on, a refund meant to return a buyer's store credit returned a hundredth of it: dollars and credit had been mixed up in one calculation. It was caught and put right, but it changed how PlayerBay handles money for good.",
          "Today every change to a balance goes through a single function. It writes a ledger entry inside a database transaction, together with a key unique to that change, so replaying an event changes nothing. Every way of refunding an order shares the same key, so two refunds racing each other can't both pay out. A test fails the build if any other code touches a balance, and the old code that used to was deleted rather than left lying around.",
          "Buyers and sellers are kept on separate books. Buyers earn a little back on every purchase as store credit to spend on PlayerBay. Sellers earn dollars they withdraw. Keeping the two apart stops credit from compounding into something the platform would eventually have to pay for.",
          "Payment notifications from Stripe and NOWPayments land on Cloudflare Workers, which answer straight away and queue the work, so a slow moment on our side never means a lost or doubled payment. And an order only counts as paid when the server can show the payment covered the amount it calculated itself. If it doesn't, the order is refunded and flagged automatically.",
        ],
      },
      {
        title: "Keeping fraud out without slowing everyone down",
        paragraphs: [
          "Stolen cards come with selling digital goods. One evening a group tried more than ten cards from four countries in about half an hour. Our limits kept it from getting expensive, but the investigation turned up something more useful: behind Cloudflare, requests were being logged with Cloudflare's address instead of the visitor's, which had quietly weakened one of the checks built to catch exactly this. We fixed it and rebuilt the records it had affected.",
          "That evening shaped the review tools. Payments now pass limits on attempts per buyer, per network address and per card. Riskier orders wait before delivery instead of going straight out, and suspicious ones reach staff with the signals laid out and a written assessment from an AI model, so a person can make the call quickly.",
          "Sellers verify their identity before they can sell, as an individual or a company. In the order chat, messages are written by the server, not the browser, and attempts to move a deal off the platform are blocked, even when an email address or handle is disguised with look-alike or hidden characters. A trade that leaves the platform leaves its protection behind, so the chat keeps both sides where the safeguards still apply.",
        ],
      },
      {
        title: "Running it with a small team",
        paragraphs: [
          "We run PlayerBay ourselves, so the routine work has to run itself. Scheduled jobs enforce dispute deadlines, release held deliveries, complete orders and send reminders. One admin covers users, seller verification, orders, disputes, payouts, the game catalog, campaigns and translations.",
          "Staff access is granular: permissions per action, a fresh identity check before anything sensitive, personal data masked by default and every action recorded. We rebuilt it in 2026 after reviewing every operation the server exposes, and removed a good deal of old code that no longer needed to exist.",
          "Sellers get tools that make a hundred listings about as much work as one: bulk upload and editing from spreadsheets, pools of keys and codes that deliver the moment payment clears, and fees that step down as their monthly sales grow. Every page works in 25 languages with prices in 10 currencies, and each language has its own sitemap, so listings can be found in all of them.",
        ],
      },
    ],
    pullLine:
      "A marketplace promise is only as good as the code that enforces it on its worst day.",
    outcome: {
      title: "Where it is now",
      paragraphs: [
        "PlayerBay is live at playerbay.com and we run it day to day: answering what users run into, tightening fraud rules as new patterns appear and improving it as we go. More than 3,200 test files cover it, many walking through whole orders and disputes, because that's what lets us change a system that moves money without holding our breath.",
        "It's also why we take on this kind of work for clients. Marketplaces, payments and the operations behind them are things we've built, broken and fixed on our own platform, with our own money at stake.",
      ],
    },
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
      "A free, open-source VS Code extension that gives the OpenCode coding agent a proper chat panel beside your code, with every step it takes on one timeline and nothing approved without you.",
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
      "OpenCode is a capable coding agent that lives in the terminal. Its official VS Code extension opens that terminal in a split pane, where copying text, following links and keeping up with what the agent is doing all fight the terminal.",
      "We wanted what you'd want from any tool that reads your files and runs commands on your machine: to see each step as it happens, to answer its requests for permission without losing your place, and to be sure nothing is ever approved behind your back.",
      "Just as important was what it shouldn't do. No account, no service of ours, no telemetry and no lock-in. A session started in Sidecar carries on in OpenCode's own terminal interface, and the other way around.",
    ],
    productLabel: "Get the extension",
    promises: [
      "Nothing approved for you",
      "Every step on one timeline",
      "No telemetry, no service of ours",
      "Your sessions stay OpenCode's",
    ],
    facts: [
      { value: "600+", label: "Unit tests" },
      { value: "150+", label: "Headless-browser tests" },
      { value: "4", label: "Editors supported" },
      { value: "None", label: "Telemetry" },
      { value: "MIT", label: "Open-source license" },
    ],
    factsSource:
      "Counted from Sidecar's source code and test suite in November 2026.",
    flow: {
      title: "How a prompt works",
      intro:
        "From the message box to the diff, every step stays visible and under your control.",
      steps: [
        {
          title: "Prompt",
          body: "Type with @ mentions, pasted screenshots and / commands. It goes to the OpenCode service on your machine.",
        },
        {
          title: "Timeline",
          body: "Each step appears as it happens: thinking time, every tool call with its input and output, and every edit.",
        },
        {
          title: "Subagents",
          body: "Each subagent gets a live row with its activity and a Stop button. Its report comes back as a single line.",
        },
        {
          title: "Permissions",
          body: "A request for permission, even from deep inside a subagent, takes the message box's place until you answer.",
        },
        {
          title: "Steer or queue",
          body: "Redirect the running task or queue your next message. Budget Guard stops a task at the limit you set.",
        },
        {
          title: "Review",
          body: "Edits open in VS Code's diff editor, apart from yours. Rewind or fork from any prompt to try again.",
        },
      ],
    },
    chapters: [
      {
        title: "A thin layer over OpenCode",
        paragraphs: [
          "Sidecar doesn't try to be a second agent. It talks to the OpenCode service already running on your machine, through OpenCode's own HTTP API and live event stream, so sessions, models, agents and permission rules all stay OpenCode's. Change something in the terminal or in another window and Sidecar shows it as it happens.",
          "Everything that talks to OpenCode sits behind a single interface, and nothing from the wire reaches the screen directly. Saved history is replayed through the same events as a live session, so a conversation you reopen tomorrow looks exactly as it did while it ran. That boundary is also why most of the extension can be tested in plain Node, without starting VS Code at all.",
        ],
      },
      {
        title: "Keeping the developer in charge",
        paragraphs: [
          "Every prompt gets its own timeline: each thought, tool call, edit and subagent, as it happens. Subagents were the hard part. A subagent runs in its own child session, and when it needs permission the request belongs to that child while the parent sits waiting. Sidecar brings those requests into the chat you're actually looking at, in place of the message box, and sends your answer back to the right session.",
          "Edits open in VS Code's own diff editor, rebuilt from OpenCode's snapshots so your changes and the agent's aren't mixed together. When a patch is partial or binary, Sidecar says the diff isn't available rather than guessing at one. Budget Guard follows the same rule: it counts only what OpenCode reports, warns at 80% of your limit and stops the task before the step that would cross it.",
          "If a run goes wrong, you can rewind to just before any prompt, with or without its code changes, or fork from that point into a new session and keep the original.",
        ],
      },
      {
        title: "Private by default",
        paragraphs: [
          "An extension that watches an agent at work shouldn't become one more thing to watch. Sidecar connects only to your local OpenCode service, sends no telemetry and leaves sign-in to OpenCode. The panel runs under a strict content security policy, never inserts raw HTML and checks every message it receives against a schema. Because OpenCode can run commands, Sidecar stays switched off in workspaces VS Code doesn't trust.",
        ],
      },
      {
        title: "Shipping in public",
        paragraphs: [
          "Version 0.1.0 went out on November 23, 2026, published from one workflow to GitHub, the Visual Studio Marketplace and Open VSX, so it installs in VS Code, Cursor, Windsurf and VSCodium alike. Three more releases followed that day as we used it and fixed what we found, like a warning strip that appeared in folders without git snapshots and a cache countdown that made no sense for models without a prompt cache.",
          "The first issues filed on GitHub were the kind you only find in the wild. On Windows, VS Code reports the drive as c: while OpenCode records C:, so sessions started in the terminal were missing from Sidecar's history. A service listening on 0.0.0.0 was mistaken for a remote one. And OpenCode 2.4 changed how subagent reports arrive, so Sidecar learned to read both forms. All of it shipped within the first eight releases, over four days.",
          "The test suite grew alongside it: more than 600 unit tests, over 150 tests that drive the real chat panel in a headless browser, and scenarios that run against a live OpenCode service in a real VS Code window. One of them gives the agent a read-only task in a real repository and fails if a single byte changes.",
        ],
      },
    ],
    pullLine:
      "An agent that reads your files and runs your commands should never act where you can't see it.",
    outcome: {
      title: "Where it is now",
      paragraphs: [
        "Sidecar is free and MIT-licensed, with its source on GitHub and a live demo on opencodesidecar.com built from the extension's real interface code. We keep developing it in the open, and the next round of work, including pasted-text chips, quick side questions that don't interrupt a running task and an agents panel, comes from the most requested features in OpenCode's own issue tracker.",
        "For us it's a working example of how we like to build: a small, focused tool, tested against the real thing, released early and improved from what people actually report.",
      ],
    },
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
  {
    slug: "graceful-era-vitality",
    name: "Graceful Era Vitality",
    links: [],
    status: "In private preview ahead of launch",
    category: "Wellness brand",
    summary:
      "The website for a new midlife wellness brand for women: warm, botanical and careful with every claim, built to grow a waitlist now and open on launch day.",
    role: "Website design, engineering and launch preparation, built around the brand's own identity.",
    image: "/images/studio/graceful-era-home.webp",
    mobileImage: "/images/studio/graceful-era-home-mobile.webp",
    hero: {
      image: "/images/studio/graceful-era-home-hero.webp",
      focus: "object-top",
    },
    imageAlt:
      "Graceful Era Vitality's homepage: the headline \"Through midlife and beyond\" beside a dark glass supplement bottle with the brand's cream label, framed by green leaves",
    story: {
      headline: "A warm, careful home for a midlife wellness brand.",
      tone: "graceful-era",
      image: "/images/studio/graceful-era-bottle-story.webp",
    },
    challenge: [
      "A new wellness brand for women in midlife needed a website that felt like the brand itself: warm, personal and botanical, somewhere women come back to rather than a one-page bottle shop.",
      "Supplements also come with rules. Words like treats, cures and prevents are off limits, and every statement about where the products come from has to be one the brand can stand behind. The site had to make careful wording easy to keep and hard to lose, including months from now, when someone edits a page in a hurry.",
      "And it had to launch in stages: shared privately while the products and copy were finalized, visible to search engines the whole time, and collecting a waitlist before anything went on sale.",
    ],
    productLabel: "Status",
    promises: [
      "No treatment or cure claims",
      "Clear reasons, not overclaims",
      "Origin stated as it really is",
      "A calm read on any screen",
    ],
    facts: [
      { value: "261", label: "Automated tests" },
      { value: "None", label: "Treatment claims" },
      { value: "3", label: "Bot-protected forms" },
      { value: "3", label: "Hero crops, one per screen size" },
      { value: "72", label: "Starter files removed" },
    ],
    factsSource:
      "Counted from the Graceful Era Vitality codebase and its test run in November 2026, ahead of launch.",
    flow: {
      title: "How the launch works",
      intro:
        "From the first private preview to opening day, the site can be shown, found and trusted before anything is for sale.",
      steps: [
        {
          title: "Private preview",
          body: "Every page sits behind a viewing password, checked on the server, so the real content never reaches a locked visitor.",
        },
        {
          title: "Found early",
          body: "Search engines and link previews are let through, so pages are indexed and shared links look right before launch.",
        },
        {
          title: "Waitlist",
          body: "Visitors join with an email address behind a bot check. Repeat sign-ups are recognized and a confirmation goes out.",
        },
        {
          title: "Feedback rounds",
          body: "The brand's feedback ships in reviewed rounds, and the tests describing each section change with it.",
        },
        {
          title: "Self-serve settings",
          body: "The team edits page titles, the footer, contact details and social links from an admin page, with no deploy.",
        },
        {
          title: "Launch",
          body: "Opening the site is one setting. The pages, sitemap and structured data are already in place.",
        },
      ],
    },
    chapters: [
      {
        title: "Carrying the brand onto every screen",
        paragraphs: [
          "The brand came with a clear identity: parchment cream, deep forest green and warm gold, a classical serif for headings and a handwritten script for a few signature lines. We defined those once as design tokens, so every page draws on the same palette and type, and paired them with a clean sans-serif for comfortable reading.",
          "Photography got the most care. The hero image is framed separately for phones, tablets and desktops, using a cropping tool we built into the site's development mode so each crop could be judged on the real layout. Hand-drawn botanicals are cut out as transparent layers and placed around each section, so they frame the words instead of sitting behind them. Motion is gentle, a soft parallax on the story page, and it holds still for visitors who prefer reduced motion.",
          "A Costa Rican Origin seal carries the brand's story through the site, from the story page to the contact form and the footer.",
        ],
      },
      {
        title: "Making careful wording the default",
        paragraphs: [
          "The copy says supports and helps you feel. It never says treats, cures or prevents. Origin is described as it really is: Costa Rica is the brand's formulation and manufacturing relationship, not a claim that every botanical is grown there.",
          "Rules like these wear away one edit at a time, so we wrote them into the site. Product content lives in a single typed catalog, where each botanical carries notes on what it may not claim. Tests read the FAQ, the product content and the site's plain-language description for AI assistants, and fail if the required disclaimer goes missing or a stronger claim creeps in.",
        ],
      },
      {
        title: "A launch that's ready early",
        paragraphs: [
          "While the brand finished its products and copy, every page sat behind a viewing password. The lock runs on the server, so a locked visitor is sent the preview page in place of the real one. There's no overlay to remove in the browser and nothing to find in the page source. Search engines and link previews are let through, so pages were indexed and shared links looked right well before launch.",
          "Visitors can join the waitlist with an email address, and every form on the site, from sign-in to the waitlist and contact form, checks for bots on the server. The brand's team edits page titles, the footer, contact details and social links from a small admin page without waiting on a deploy. Opening the site on launch day is a single setting.",
        ],
      },
      {
        title: "A codebase that stays easy to change",
        paragraphs: [
          "The site began from a starter template with public sign-up, billing and dashboards that a brand site doesn't need. We took them out, 72 unused files and 37 unused packages in all, leaving staff sign-in, password reset and a guarded settings page. Then we upgraded to Next.js 16 and React 19 and made the typecheck fail on unused code, so the cleanup stays clean.",
          "The brand's feedback arrives in rounds, and each round ships with the tests that describe the sections it touches, 261 of them so far. A change to one page can't quietly break another.",
        ],
      },
    ],
    pullLine:
      "Careful wording only lasts if the website makes it the easy thing to do.",
    outcome: {
      title: "Where it is now",
      paragraphs: [
        "The site is in private preview while the brand prepares to launch. It's already indexed, collecting its waitlist and ready to open with a single setting.",
        "We'll link to it here once it's public. Until then, the launch is the brand's to announce.",
      ],
    },
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "MongoDB",
      "Mongoose",
      "NextAuth",
      "Cloudflare Turnstile",
      "Resend",
      "Framer Motion",
      "Vitest",
      "Vercel",
    ],
  },
  {
    slug: "disciples-insurance",
    name: "Disciples Insurance",
    website: "https://www.disciplesinsurance.com",
    links: [],
    category: "Insurance broker",
    summary:
      "The website for an independent Arizona insurance broker who explains coverage before he sells it: plain-language pages for every policy, articles he publishes himself and his quoting tool a click away.",
    role: "Website design, engineering, content management and ongoing care.",
    image: "/images/studio/disciples-home.webp",
    mobileImage: "/images/studio/disciples-home-mobile.webp",
    hero: {
      image: "/images/studio/disciples-home-hero.webp",
      focus: "object-top",
    },
    imageAlt:
      "Disciples Insurance's homepage: local Arizona insurance with honest service, in warm beige and charcoal",
    story: {
      headline: "An education-first home for a local Arizona broker.",
      tone: "disciples",
      image: "/images/studio/disciples-home-story.webp",
      focus: "object-right-top",
    },
    challenge: [
      "Jack Adams founded Disciples Insurance because he was tired of seeing insurance treated like a transaction instead of a relationship. He's an independent broker in Phoenix, and his approach is simple: explain the coverage plainly, then help people choose.",
      "Most insurance websites work the other way round. They push visitors toward a quote form and leave the real questions for later: what a policy covers, what it doesn't, and why it costs what it does. Jack needed a site that answered those questions first, for families shopping for auto and home cover and for business owners comparing liability, property and workers' comp.",
      "And it had to stay his. A one-person agency can't wait on a developer to change a sentence, so every page had to be something Jack could edit himself, live the moment he saved it.",
    ],
    productLabel: "Live site",
    promises: [
      "Coverage explained up front",
      "Quotes compared across carriers",
      "A direct line to a local broker",
      "Answers in plain language",
    ],
    facts: [
      { value: "14", label: "Public pages" },
      { value: "25", label: "Sections the broker edits himself" },
      { value: "5", label: "Pages managed from the admin" },
      { value: "24", label: "Carriers shown" },
      { value: "10", label: "Types of coverage explained" },
    ],
    factsSource:
      "Counted from the Disciples Insurance codebase in November 2026.",
    flow: {
      title: "How a change goes live",
      intro:
        "Jack edits his own site. This is what happens between pressing save and a visitor reading the new words.",
      steps: [
        {
          title: "Edit a section",
          body: "Each section of the main pages has its own form in the admin, from the homepage headline to the coverage cards, the FAQ and the contact details.",
        },
        {
          title: "Save",
          body: "The change is checked and stored, and the admin records who changed which fields and when.",
        },
        {
          title: "Refresh only that page",
          body: "Saving clears the cache for the page that changed and for the sitemap. Every other page stays exactly as it was.",
        },
        {
          title: "Live on the next visit",
          body: "The next visitor gets the new version, built once and fast to load. There's no timer to wait for and no deploy.",
        },
        {
          title: "Found by search",
          body: "The sitemap's dates move with real edits, so search engines can tell what's actually new.",
        },
        {
          title: "Hide until ready",
          body: "A section that isn't ready can be switched off without deleting it, then switched back on later.",
        },
      ],
    },
    chapters: [
      {
        title: "Explaining coverage before selling it",
        paragraphs: [
          "The site is organized around questions rather than products. Personal coverage (auto, home, renters and umbrella) and business coverage (general liability, commercial property, commercial auto, workers' comp, business owner's policies and errors and omissions) each get their own plain-language explanation. A How We Help page walks through what working with Jack looks like, and an FAQ covers the questions he hears most.",
          "It's a faith-based business, and the About page says so in Jack's own words. The rest of the site lets that show through in how it talks: honest, patient and never pushy.",
          "Search engines get the same clarity as visitors. Each page has its own title and description, which Jack can change from the admin, and structured data marks the business as a local insurance agency serving Arizona.",
        ],
      },
      {
        title: "Using the quoting tool he already trusts",
        paragraphs: [
          "Jack already compared quotes across carriers with an independent comparative rater. Rebuilding that would have cost months and added nothing, so we built the site around it. On a desktop the quote form sits right on the contact page; on a phone, one button opens it full screen, where it's easier to fill in.",
          "The rater's address lives in the admin, so if Jack changes tools the site follows without a code change. Everything else is a direct line: tap to call, text or email Jack. A rotating grid shows the 24 carriers he works with.",
        ],
      },
      {
        title: "A site the broker runs himself",
        paragraphs: [
          "We built a custom admin rather than bolting on a generic page builder. The homepage, About, How We Help, Insurance and Contact pages are split into 25 sections, and each one is its own small form with its own fields. Jack changes a headline or adds an FAQ without touching anything around it, and the layout can't break because the design isn't his to edit.",
          "Sections can be hidden and brought back. Every save is logged with the fields that changed, so if something looks different there's always an answer to what happened and when.",
        ],
      },
      {
        title: "Fast pages that are never out of date",
        paragraphs: [
          "Most sites like this rebuild their pages on a timer, every few minutes whether anything changed or not. That's wasted work, and edits still take a while to show. Instead, each page is built once and kept until its content actually changes. Saving in the admin clears exactly that page and the sitemap, so edits appear straight away and visitors get a page that's already built.",
          "Articles are written in WordPress, which Jack already knew, and shown on the site itself with search, category filters, pagination and links to the next read. New articles reach the sitemap on their own, so they're found without anyone resubmitting anything.",
        ],
      },
    ],
    pullLine:
      "A broker who explains before he sells needed a website that does the same.",
    outcome: {
      title: "Where it is now",
      paragraphs: [
        "Disciples Insurance is live. Jack edits the site himself, publishes articles from WordPress and sends visitors to his quoting tool when they're ready.",
        "We still look after it. Since launch we've patched a vulnerable dependency, sharpened the search metadata and tidied the layout on phones.",
      ],
    },
    stack: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "MongoDB",
      "Mongoose",
      "NextAuth",
      "WordPress",
      "GSAP",
      "Cloudflare Turnstile",
      "Resend",
      "Microsoft Clarity",
      "Vercel",
    ],
  },
  {
    slug: "oden-watches-jewelry",
    name: "Oden Watches & Jewelry",
    website: "https://odenjh.com",
    links: [],
    category: "Luxury retail",
    summary:
      "A fine jewelry and Swiss watch boutique in Jackson Hole, in the heart of the Tetons. Since 2023 we've looked after its technology end to end: the website and catalog, email, security, brand outreach and hiring.",
    role: "Long-term technology partner: website, catalog, email, security, brand outreach and hiring support.",
    image: "/images/studio/oden-home.webp",
    mobileImage: "/images/studio/oden-home-mobile.webp",
    hero: {
      image: "/images/studio/oden-home-hero.webp",
      focus: "object-top",
    },
    imageAlt:
      "Oden Watches & Jewelry's homepage: the navy and gold antler monogram above a JB Star diamond earring and ring",
    story: {
      headline: "The technology partner behind a Jackson Hole boutique.",
      tone: "oden",
      image: "/images/studio/oden-earrings-story.webp",
    },
    challenge: [
      "Oden is a fine jewelry and Swiss watch boutique on Glenwood Street in Jackson, Wyoming. Its founding idea is that luxury should feel warm, welcoming and personal, and its team has spent decades with some of the most respected names in jewelry and watches.",
      "A small boutique runs on the same technology as a large retailer: a website that has to feel as considered as the showroom, email that customers and brands rely on, accounts that need protecting, and relationships with the designers whose pieces fill the cases. What it doesn't have is an IT department.",
      "Oden needed one partner to look after all of it, year after year, so the team could stay focused on the people walking through the door.",
    ],
    productLabel: "Live site",
    promises: [
      "A showroom that's open online",
      "Repairs start with a few photos",
      "One partner for all of the tech",
      "Looked after since 2023",
    ],
    facts: [
      { value: "2023", label: "Working together since" },
      { value: "10", label: "Designers featured on the site" },
      { value: "12", label: "Repair services in the online intake" },
      { value: "6", label: "Areas we look after" },
    ],
    factsSource:
      "Counted from odenjh.com in November 2026. Areas covered: website, catalog, email, security, brand outreach and hiring.",
    flow: {
      title: "What we look after",
      intro:
        "Oden doesn't have an IT department. It has us, and this is the work that keeps the boutique's technology out of the team's way.",
      steps: [
        {
          title: "Website",
          body: "Design, upkeep and new pages as the boutique grows, from the staff and philanthropy pages to banners for each new designer.",
        },
        {
          title: "Catalog",
          body: "Fine jewelry, engagement pieces and timepieces, organized by category, by designer and, for watches, by movement.",
        },
        {
          title: "Repairs intake",
          body: "An online form that gathers a piece's details and photos before it ever reaches the bench.",
        },
        {
          title: "Email",
          body: "The email the boutique depends on, with customers and with the brands it carries.",
        },
        {
          title: "Security",
          body: "Keeping the site, its accounts and the boutique's systems protected and up to date.",
        },
        {
          title: "Brands and hiring",
          body: "Outreach to the designers and watchmakers Oden works with, and help finding the right people to join the team.",
        },
      ],
    },
    chapters: [
      {
        title: "A showroom that's open online",
        paragraphs: [
          "Walking into Oden should feel personal, and the website had to feel the same way. The navy and gold antler monogram leads every page, and the site is arranged the way the showroom is: fine jewelry by category and by designer, an engagement collection with wedding bands and a diamond guide, and timepieces by movement and by maker.",
          "Each designer gets room to show their work. Full-width banners introduce JB Star's diamonds, Norqain's Swiss watches and Breitling's timepieces, with names like Vincent Peach, Shy Creation and Locman alongside. When the boutique takes on a new designer or a new season's pieces arrive, the site changes with it.",
        ],
      },
      {
        title: "Repairs that start before the visit",
        paragraphs: [
          "Oden has its own jewelry workshop and watchmaker, and repair work is a big part of what brings people back. The repair page lets a customer start the conversation from home: what the piece is, who made it, the metal and stones, which of twelve services it needs, from ring sizing and pearl restringing to a full watch service, and a few well-lit photos.",
          "By the time the piece arrives, the team already knows what they're looking at. A hidden trap field catches spam bots quietly, without asking customers to solve a puzzle first.",
        ],
      },
      {
        title: "More than a website",
        paragraphs: [
          "Most of what we do for Oden never shows up on a page. We run the boutique's email, so messages to customers and designers arrive and replies don't go missing. We look after security, keeping the site, its accounts and the boutique's systems patched and protected.",
          "We also work on the business side. We've helped with outreach to the brands Oden carries and wants to carry, and with hiring as the team has grown. For a small team, having one partner who already knows how everything fits together means a question gets answered in a message, not a project.",
        ],
      },
      {
        title: "Years, not a launch",
        paragraphs: [
          "A boutique's website is never finished. Since 2023 we've added pages for the staff and for the causes Oden supports, introduced new designers, refreshed seasonal banners and kept everything underneath current.",
          "That's the kind of work we like best: the long relationship where we know the business well enough to see what it needs next.",
        ],
      },
    ],
    pullLine:
      "A small boutique runs on the same technology as a large retailer. It just doesn't have an IT department.",
    outcome: {
      title: "Where it is now",
      paragraphs: [
        "Oden is open on Glenwood Street and online at odenjh.com, and we're still looking after its technology day to day.",
      ],
    },
    stack: ["WordPress", "WooCommerce"],
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

export const studioFigures = [
  {
    value: "15+",
    label: "Years of combined experience",
    short: "years of experience",
  },
  { value: "100+", label: "Projects shipped", short: "projects shipped" },
  { value: "25+", label: "Clients served", short: "clients" },
  { value: "10+", label: "Industries served", short: "industries" },
  {
    value: String(new Date().getFullYear() - siteConfig.foundingYear),
    label: "Years in business",
    short: "years in business",
  },
] as const satisfies readonly { value: string; label: string; short: string }[]
