---
title: "Stripe webhooks that never double-charge: idempotency, retries and ordering"
description: "Stripe can send the same webhook twice, out of order, for days. How to verify signatures, deduplicate events, use idempotency keys and build handlers that are safe to run again."
topic: Payments
tags: [Stripe, Webhooks, Payments, Idempotency]
cover:
  image: media/stripe-webhooks-without-double-charging/cover.jpg
  alt: "A customer paying with a handheld card reader"
  credit: Photo by SumUp on Unsplash
  creditUrl: https://unsplash.com/photos/wVqTWs-1nmI
---

Most payment bugs don't come from Stripe. They come from the code that reacts to Stripe.

A customer pays once. Your webhook handler runs twice. Two orders ship, two licenses are issued, or a subscription is provisioned again. Nothing crashed, no error was logged, and the bug only shows up when someone reads the database or the customer emails you.

This happens because webhooks are delivered **at least once**, not exactly once. This guide covers what Stripe actually guarantees, and the four habits that make a handler safe no matter how many times an event arrives.

:::summary
- Stripe can deliver the same event more than once, and doesn't guarantee order. Design every handler to be safe to run again.
- Verify the signature against the **raw** request body before doing anything else.
- Record each event ID with a unique constraint, inside the same transaction as the work it triggers.
- Send an `Idempotency-Key` with every request that creates or charges something, so your own retries can't double-charge.
- Return a 2xx quickly. Slow handlers time out, and timeouts become retries.
:::

## What Stripe actually guarantees

Three facts drive everything else:

1. **Events can arrive more than once.** A network blip after your server processed an event, but before Stripe saw your response, means Stripe sends it again. Stripe's own docs tell you to guard against duplicate events.
2. **Order isn't guaranteed.** `invoice.paid` can arrive before `customer.subscription.created`. Handlers that assume the previous event already happened will break, usually rarely and in production.
3. **Failed deliveries are retried for days.** In live mode, Stripe keeps retrying an event your endpoint didn't acknowledge for up to three days, with exponential backoff. A bug you fix on Tuesday can still receive Monday's events.

So "my handler only runs once" is never true. The question is what happens when it runs again.

Stripe's own developer team walks through the same failure modes in this short video:

:::youtube 47sSju0UhPk
Webhook handling: building rock-solid Stripe integrations (Stripe Developers)
:::

## Step 1: Verify the signature on the raw body

Every webhook carries a `Stripe-Signature` header. Verifying it proves the request came from Stripe and wasn't altered. Skip this, and anyone who finds your endpoint can post a fake `checkout.session.completed` and get free products.

The detail that trips people up: the signature is computed over the **exact bytes** Stripe sent. If your framework parses the JSON first and you re-serialize it, the signature won't match. In a Next.js route handler, read the raw text:

```ts
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }

  await handleEvent(event)
  return new Response(null, { status: 200 })
}
```

`constructEvent` also rejects events with an old timestamp, which protects you from replayed requests.

:::callout warning
Your webhook secret (`whsec_...`) is different for each endpoint, and different again for the Stripe CLI's local forwarding. A "signature verification failed" error after deploying usually means the production endpoint's secret isn't the one in your environment.
:::

## Step 2: Process each event once

Store the ID of every event you handle, and refuse to handle it twice. The key is doing it **atomically**: record the event in the same database transaction as the work it triggers.

```sql
create table processed_events (
  event_id   text primary key,
  type       text not null,
  processed_at timestamptz not null default now()
);
```

```ts
const handleEvent = async (event: Stripe.Event) => {
  await db.transaction(async (tx) => {
    const inserted = await tx.query(
      "insert into processed_events (event_id, type) values ($1, $2) on conflict do nothing",
      [event.id, event.type]
    )
    if (inserted.rowCount === 0) return

    await applyEvent(tx, event)
  })
}
```

If two deliveries of the same event race each other, the primary key lets exactly one of them insert the row. The other sees zero rows inserted and does nothing. If `applyEvent` throws, the whole transaction rolls back, including the `processed_events` row, so Stripe's retry gets another chance.

The common mistake is checking first, then inserting later:

```ts
if (await alreadyProcessed(event.id)) return
await applyEvent(event)
await markProcessed(event.id)
```

Two simultaneous deliveries both pass the check before either marks the event, and both apply it. Only a unique constraint enforced by the database closes that gap.

## Step 3: Make the work itself idempotent

Deduplicating by event ID protects you from the same event twice. It doesn't protect you from two *different* events that mean the same thing, like `checkout.session.completed` and `payment_intent.succeeded` for one purchase, or from your own code being retried.

So make the side effects idempotent too:

- **Key business records to Stripe's IDs.** Give your `orders` table a unique column for the Checkout Session or PaymentIntent ID. Creating the same order twice then fails instead of duplicating.
- **Set state rather than increment it.** "Set the subscription status to `active`" is safe to repeat. "Add one month of credit" is not.
- **Guard state transitions.** Only move an invoice from `open` to `paid` if it's currently `open`. Running it again finds it already `paid` and does nothing.

## Step 4: Handle events arriving out of order

Because order isn't guaranteed, don't trust the snapshot inside an older event to be the latest truth. Two reliable patterns:

1. **Treat the event as a signal, then fetch the current state.** When `customer.subscription.updated` arrives, retrieve the subscription from Stripe and store what the API returns now. Events become "something changed, go look" rather than "here is the truth."
2. **Compare timestamps or versions before writing.** Store the `created` time of the event that last updated a record, and ignore events older than it.

Fetching costs an API call per event, but it removes a whole class of bugs. For most apps it's the right default.

## Step 5: Use idempotency keys on your own requests

Webhooks are the inbound half. The outbound half is your code calling Stripe, and it has the mirror-image problem: your request times out, you retry, and Stripe processed the first one after all.

Stripe's API accepts an `Idempotency-Key` header. Send the same key on a retry, and Stripe returns the original result instead of performing the action again:

```ts
await stripe.paymentIntents.create(
  { amount: order.totalCents, currency: "usd", customer: order.customerId },
  { idempotencyKey: `order-${order.id}-payment` }
)
```

Derive the key from your own record, not from a random value generated per attempt, so every retry of the same intent sends the same key. Stripe keeps keys for at least 24 hours, and it rejects a reused key that comes with different parameters, which catches bugs where two different charges accidentally share a key.

## Step 6: Respond fast, do heavy work later

Stripe waits a limited time for your response, then counts the delivery as failed and retries it. If your handler sends emails, generates PDFs and calls three other services before responding, slow days turn into duplicate deliveries.

Keep the webhook handler small:

1. Verify the signature.
2. Record the event and update the core records in one transaction.
3. Queue anything slow, such as email, fulfillment or analytics, as a background job.
4. Return 200.

Background jobs need the same idempotency treatment, keyed to the event or record they came from.

## Test the failure cases, not just the happy path

The Stripe CLI forwards events to your local machine and can trigger them on demand:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
```

Then test what actually breaks things:

- **Replay the same event** and confirm nothing happens the second time.
- **Send two events in the wrong order** and confirm the final state is still correct.
- **Make your handler throw** halfway through, then let the retry run, and confirm there's no half-applied state.

:::faq
### Can Stripe send the same webhook event twice?

Yes. Webhooks are delivered at least once, so the same event can arrive more than once, for example when a network error hides your successful response from Stripe. Record each event ID with a unique constraint and skip events you've already processed.

### Are Stripe webhook events delivered in order?

No. Stripe doesn't guarantee delivery order, so a later event can arrive before an earlier one. Treat events as notifications and fetch the current object from the API, or compare timestamps before overwriting newer data.

### How long does Stripe retry failed webhooks?

In live mode, Stripe retries undelivered events for up to three days with exponential backoff. Your endpoint should return a 2xx status quickly to acknowledge an event.

### Why does Stripe webhook signature verification fail?

Usually because the body was parsed and re-serialized before verification, or because the wrong signing secret is configured. Verify against the raw request body, and use the secret for that specific endpoint.

### What is a Stripe idempotency key?

A value you send in the `Idempotency-Key` header when creating or charging something. If the same request is retried with the same key, Stripe returns the original result instead of repeating the action. Keys are kept for at least 24 hours.
:::

:::sources
- [Receive Stripe events in your webhook endpoint, Stripe docs](https://docs.stripe.com/webhooks)
- [Idempotent requests, Stripe API reference](https://docs.stripe.com/api/idempotent_requests)
- [Advanced error handling, Stripe docs](https://docs.stripe.com/error-low-level)
- [Stripe CLI, Stripe docs](https://docs.stripe.com/stripe-cli)
- [Stripe webhooks in production: duplicates, ordering, retries and timeouts, Hookdeck](https://hookdeck.com/webhooks/stripe/guide-duplicates-ordering-retries-timeouts)
:::
