---
title: "Modular monoliths: how to draw boundaries that actually hold"
description: "A practical guide to modular monoliths: how to define modules, enforce boundaries in TypeScript, keep data ownership clean and know when a module has earned its own service."
topic: Architecture
tags: [Modular monolith, Microservices, TypeScript]
---

Most teams that "go microservices" are not solving a scaling problem. They are solving a code organization problem with a network. The network is the expensive part.

A modular monolith keeps one deployable application but splits it into modules with hard edges: each module owns its data, exposes a small public interface and hides everything else. You get most of the organizational benefits of services without paying for distributed systems on day one.

This guide covers how we structure them, how to enforce the boundaries so they survive a deadline, and how to tell when a module has genuinely earned its own service.

:::summary
- A module is defined by what it hides, not by its folder. Each one owns its data and exposes a small public interface.
- Boundaries that aren't enforced by tooling erode within months. Make the build fail when one module reaches into another.
- Never share tables between modules. Shared data is shared coupling, and it is what makes later extraction painful.
- Split a module into a service when it has a different scaling, deployment or reliability profile, not because the codebase feels big.
:::

## What a modular monolith actually is

A monolith is one deployable unit. That part is not the problem. The problem with most monoliths is that any file can import any other file and any query can join any table. After a few years, every change touches everything.

A modular monolith adds three rules on top of a single deployable:

1. **Modules have a public interface.** Other modules call `billing.issueInvoice()`. They never import `billing/internal/tax-calculator`.
2. **Modules own their data.** The billing module's tables are read and written only by billing code.
3. **Dependencies point one way.** If orders depend on billing, billing does not depend on orders. Cycles are a build error.

Shopify is the best-documented example at scale. Rather than splitting its large Rails application into services, it reorganized the codebase into components with explicit boundaries, and later built Packwerk, a static analysis tool, to enforce them. Their engineering team considered microservices and chose modularity instead, citing the complexity of distributed systems.

## Monolith, modular monolith or microservices?

| | Classic monolith | Modular monolith | Microservices |
|---|---|---|---|
| Deployables | One | One | Many |
| Boundaries | Conventions, if any | Enforced in the build | Enforced by the network |
| Cross-module calls | Any function | Public interfaces only | HTTP or messaging |
| Data | Shared database, shared tables | Shared database, owned tables | Database per service |
| Transactions | Easy | Easy within a module | Distributed, hard |
| Operational cost | Low | Low | High |
| Independent scaling | No | No | Yes |

The middle column is the one most teams actually need. It is also the cheapest path to the right-hand column later, because the hard part of extracting a service is untangling it. A well-kept module is already untangled.

:::callout note
Microservices are a deployment and organizational tool. They pay off when separate teams need to ship independently, or when parts of the system have very different scaling needs. A team of five usually has neither problem.
:::

## How to draw module boundaries

Most failed modularization starts with folders named after technical layers: `controllers`, `services`, `models`. Those cut every feature into pieces and guarantee that each change touches every folder.

Draw boundaries around business capabilities instead. In a marketplace that might be catalog, orders, payments, payouts, messaging and identity. A useful test: could you describe the module to a non-engineer in one sentence, and would they recognize it as a real part of the business?

Inside each module, we use the same four layers on every project:

```
src/features/billing/
  domain/        pure business rules, no I/O, fully unit tested
  application/   use cases that depend on ports (interfaces)
  server/        adapters: database, Stripe, email
  components/    UI for this feature
```

The domain layer holds the rules that matter most, such as "an issued invoice can never be edited", in plain functions you can test in milliseconds. The application layer coordinates them through interfaces, so tests run against in-memory doubles instead of a real database. Vendors like Stripe or an email provider live only in `server/`. Swapping one touches one folder.

### Signs a boundary is in the wrong place

- Two modules change together in most pull requests.
- One module needs another's internal types to do anything useful.
- You can't explain who owns a table.
- A "shared" or "common" module keeps growing, and everything depends on it.

When you see these, merge the two modules or move the boundary. Boundaries are cheap to change inside one codebase. That flexibility is a big part of why you start here.

## Enforce boundaries in the build

Conventions don't survive deadlines. Someone will import an internal helper to ship a fix on a Friday, and six months later that shortcut is load-bearing. The only boundaries that last are the ones a machine checks.

In a TypeScript codebase, `eslint-plugin-boundaries` lets you classify files into element types and declare which types may import which:

```js
// eslint.config.mjs
import boundaries from "eslint-plugin-boundaries"

export default [
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "feature", pattern: "src/features/*", capture: ["name"] },
        { type: "shared", pattern: "src/lib/*" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: "feature", allow: ["shared"] },
            { from: "shared", allow: ["shared"] },
          ],
        },
      ],
    },
  },
]
```

Pair it with a rule that only allows imports through each module's public entry point (`src/features/billing/index.ts`), and an internal import becomes a lint error in the editor and in CI. Monorepos built with Nx get the same thing through its `enforce-module-boundaries` rule and project tags.

Lint rules catch imports. Some rules matter more than imports, so we also write architecture tests for them. In our own platform, a test scans every server action and fails the build if one ships without an authorization guard. It takes a few lines and runs on every commit, so the rule never depends on someone remembering it in review.

:::callout tip
Shopify's retrospective on Packwerk is worth reading before you design your own checks. They removed its privacy checks in version 3.0 because those checks pulled attention away from the problem that mattered: dependencies between components. Start with dependency direction. Add more rules only when a real problem shows up.
:::

## Data ownership is the hard part

Code boundaries are visible in every import. Data boundaries hide in SQL, and that is where modular monoliths usually fail.

The rule is simple: **a module's tables are private.** If orders need a customer's billing status, they ask billing through its interface. They don't join against billing's tables.

This feels slower at first. It pays for itself the first time billing changes its schema and nothing else breaks.

Practical ways to hold the line:

- **Separate schemas or prefixes per module.** In Postgres, one schema per module makes ownership visible and lets you restrict access by role.
- **No foreign keys across modules.** Store the other module's ID as a plain value. Reference it, don't constrain on it.
- **Read models for heavy queries.** If the dashboard needs data from five modules, build a read model fed by those modules' events instead of a five-way join.
- **Events for side effects.** When an order is paid, orders publishes `OrderPaid`. Payouts and email react to it. Orders doesn't need to know they exist.

### Keep events reliable with an outbox

In-process events are simple until something crashes between "save the order" and "publish the event." The transactional outbox pattern fixes this. Write the event to an `outbox` table in the same transaction as the business change, then deliver it from a background worker. If the process dies, the event is still waiting.

Anything involving money must be idempotent and survive retries. The outbox gives you that within a monolith, and it carries over unchanged if a module later becomes a service.

## When a module should become a service

A module has earned extraction when at least one of these is true:

- **Different scaling profile.** It needs ten times the compute of everything else, or bursts independently.
- **Different deployment cadence.** A separate team ships it daily while the rest ships weekly, and coordination is slowing them down.
- **Different reliability or compliance needs.** It handles card data, or it must stay up when everything else is down.
- **Different runtime.** It needs a GPU, a different language or long-running jobs.

"The codebase feels big" is not on the list. Neither is "it's what big companies do."

The reverse also happens. In 2018, Segment wrote about moving from more than 140 microservices back to a monolith after the operational overhead became unsustainable. In 2023, the Prime Video team described moving a video quality monitoring system from distributed serverless components into a single process. They reported cutting infrastructure cost by over 90% and removing a scaling bottleneck. Neither story means services are wrong. Both show that the network is a cost you should choose deliberately.

## Why this matters more with AI in the workflow

AI coding tools work best with small, well-defined context. A module with a clear public interface, its own tests and no hidden coupling is exactly that. An agent asked to change "billing" can be pointed at one folder, and the build will tell it immediately if it crossed a boundary.

The same property helps humans. A new engineer can learn one module at a time, and the lint rules teach the architecture faster than a wiki page.

## A migration path for an existing monolith

You don't need a rewrite. A path that works:

1. **Map the capabilities.** List the business areas and which files and tables belong to each. Expect overlap. That overlap is your to-do list.
2. **Create the module folders and move code.** Moving files is cheap. Don't fix coupling yet.
3. **Add a public entry point per module** and route new code through it.
4. **Turn on boundary linting in warning mode.** Measure the violations.
5. **Burn down the violations one module at a time,** then switch the rule to error for that module so it can't regress.
6. **Split data last.** Move tables into module-owned schemas once the code paths are clean.

Shopify's own guidance points the same way: they enforced boundaries between components only after each component was isolated.

:::faq
### Is a modular monolith just a monolith with folders?

No. Folders are conventions. A modular monolith enforces its boundaries with tooling, gives each module its own data and exposes a deliberate public interface. Without enforcement, folders drift back into a tangled monolith.

### Can a modular monolith scale?

Yes, horizontally. You run more copies of the same application behind a load balancer. What it can't do is scale one module independently of the others. If one capability needs very different resources, that is a good reason to extract it.

### Should a startup begin with microservices?

Rarely. Early on, you don't know where the real boundaries are, and moving a boundary inside one codebase is far cheaper than moving it between services. Start with well-enforced modules and extract when a module proves it needs to stand alone.

### How do modules communicate in a modular monolith?

Through direct calls to each other's public interfaces for queries and commands, and through in-process events for side effects. Use a transactional outbox when an event must not be lost.

### What tools enforce module boundaries in TypeScript?

`eslint-plugin-boundaries` works in any TypeScript project. Nx provides `enforce-module-boundaries` for Nx workspaces. For rules that go beyond imports, write small architecture tests that scan the codebase and fail the build.
:::

:::sources
- [Deconstructing the Monolith, Shopify Engineering](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity)
- [A Packwerk retrospective, Shopify Engineering](https://shopify.engineering/a-packwerk-retrospective)
- [Goodbye Microservices: from 100s of problem children to 1 superstar, Segment (Twilio)](https://www.twilio.com/en-us/blog/developers/best-practices/goodbye-microservices)
- [Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%, Prime Video Tech, via InfoQ coverage](https://www.infoq.com/news/2023/05/prime-ec2-ecs-saves-costs/)
- [eslint-plugin-boundaries](https://github.com/javierbrea/eslint-plugin-boundaries)
- [Enforce module boundaries, Nx](https://nx.dev/features/enforce-module-boundaries)
:::
