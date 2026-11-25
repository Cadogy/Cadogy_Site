---
title: "How to add AI features without runaway costs"
description: "Practical ways to keep LLM costs predictable: measure cost per feature, cache prompts, route to smaller models, batch background work, cap output and protect against abuse."
topic: AI
tags: [AI integration, LLM, Cost control, Prompt caching]
cover:
  image: media/ai-features-without-runaway-costs/cover.jpg
  alt: "Claude logo and a coins icon over a blue-toned photo of a processor"
  credit: Photo by BoliviaInteligente on Unsplash
  creditUrl: https://unsplash.com/photos/utzc2cBWUag
  marks: [claude, coins]
---

Adding an AI feature is cheap in a prototype and surprisingly easy to make expensive in production. A summary button that costs a fraction of a cent per click is fine, until a long document, a retry loop or one heavy user multiplies it by a thousand.

The good news is that most AI cost problems come from a handful of predictable causes, and each has a well-understood fix. This guide covers how pricing actually works, how to measure cost per feature, and the levers that cut spending without making the feature worse.

:::summary
- You pay per token, for input and output separately, and output usually costs several times more than input.
- Measure **cost per feature and per user** from day one. You can't control what you can't see.
- **Prompt caching** makes repeated context dramatically cheaper. Put the stable parts of your prompt first.
- **Route** simple tasks to small models, and save large models for the requests that need them.
- **Batch** work that doesn't need an instant answer. Major providers discount batch processing by 50%.
- **Cap** output length, retries and per-user usage, so one bad loop can't run up a bill.
:::

## How LLM pricing works

Most APIs charge per token, roughly three-quarters of a word in English, with separate prices for:

- **Input tokens:** everything you send, including the system prompt, instructions, retrieved documents and conversation history.
- **Output tokens:** everything the model writes back, which is typically priced several times higher than input.

Two consequences matter for cost:

1. **Context is the silent cost.** A short user question wrapped in a long system prompt, ten retrieved documents and a full chat history can be thousands of input tokens per request, every request.
2. **Long answers are expensive.** An unlimited "explain this in detail" can cost more than everything sent in.

Prices also vary enormously between model sizes within the same provider, often by more than ten times. That gap is the biggest lever you have.

## Step 1: Measure cost per feature

Every response from the major APIs reports the tokens it used. Log them with enough context to answer "what is this costing us, and where?":

```ts
type AiUsage = {
  feature: "summarize" | "search" | "draft-reply"
  userId: string
  model: string
  inputTokens: number
  cachedInputTokens: number
  outputTokens: number
  costMicros: number
}
```

Store the cost as an integer (millionths of a dollar, for example) computed from the provider's current price table, and keep that table in one place so a price change is a one-line update. Then build three views:

- **Cost per feature per day**, to catch a feature that suddenly got more expensive.
- **Cost per active user**, to see whether your pricing covers your usage.
- **Top users by cost**, to spot abuse and runaway loops early.

## Step 2: Cache the parts of the prompt that repeat

Most prompts repeat a lot: the same system instructions, the same tool definitions, the same product documentation. Prompt caching lets the provider store that repeated prefix and charge far less to reuse it.

- **Anthropic** prices cache reads at a fraction of normal input: 10% of the base input price on most models. Writing to the cache costs a bit more than normal input, so caching pays off when a prefix is reused.
- **OpenAI** applies caching automatically to prompts of 1,024 tokens or more and discounts the cached portion.

Caching only works on an **identical prefix**. Structure prompts from most stable to least stable:

1. System instructions and tool definitions (identical for everyone)
2. Reference documents for this workspace or customer (stable for a while)
3. Conversation history (grows over time)
4. The new user message (changes every time)

Put a timestamp or the user's name at the top of your system prompt, and you break the cache on every request without noticing. Check the cached token counts in your usage logs to confirm caching is actually happening.

## Step 3: Route requests to the smallest model that works

Not every request needs your most capable model. Classifying a support ticket, extracting fields from an invoice or rewriting a sentence are well within the reach of small, fast, cheap models. Complex reasoning, long-document analysis and code generation may need a larger one.

Practical routing patterns:

- **By feature.** Decide per feature which model it uses, based on testing, not on habit.
- **By difficulty.** Try a small model first and escalate to a larger one when the result fails validation or the model reports low confidence.
- **By plan.** Offer the largest models in higher pricing tiers, where the margin covers them.

Routing only works if you can tell when quality drops. Keep a small set of real examples with known good answers for each feature, and run it whenever you change models or prompts.

## Step 4: Batch anything that can wait

A lot of AI work doesn't need an answer in two seconds: nightly summaries, backfilling tags on old records, generating embeddings, scoring a week of support tickets.

Both Anthropic and OpenAI offer batch APIs at **50% off** normal prices, in exchange for results that arrive later, usually within a day. Move scheduled and bulk work there, and keep the real-time API for things a user is actively waiting on.

## Step 5: Spend fewer tokens per request

- **Cap output with `max_tokens`** on every call, sized to what the feature needs.
- **Ask for structured output** such as JSON with specific fields, rather than prose you'll parse anyway.
- **Retrieve less, but better.** Five well-chosen document chunks often beat twenty loosely related ones, both in cost and in answer quality.
- **Trim conversation history.** Summarize older turns instead of resending the whole conversation every time.
- **Cache final answers** for identical requests. The same question about the same document doesn't need a fresh call.

## Step 6: Put guardrails around usage

Most cost disasters come from loops and abuse, not normal use:

- **Per-user rate limits and daily budgets**, enforced on the server, with a clear message when someone hits them.
- **Retry limits with backoff.** A failing request retried in a tight loop is the classic way to burn a budget overnight.
- **Agent step limits.** Any loop where the model calls tools and decides what to do next needs a hard cap on steps and tokens.
- **Spending alerts** at the provider and in your own monitoring, set well below the number that would hurt.
- **Authentication on every AI endpoint.** An open endpoint that proxies to an LLM will be found and used by someone else.

## Price the feature, not just the API

AI costs scale with usage in a way most software costs don't. Before launch, estimate cost per active user under realistic and heavy usage, and check it against what that user pays. If heavy users would cost more than they pay, use plan limits, usage-based pricing or a smaller model for that tier. That's far easier than raising prices after launch.

:::faq
### Why are my OpenAI or Anthropic API costs so high?

Usually because of large inputs repeated on every request, such as long system prompts, many retrieved documents or full chat histories, plus unlimited output length and retry loops. Log token usage per feature to find the biggest cost first.

### Does prompt caching reduce LLM costs?

Yes, often substantially. Providers charge much less for input tokens read from cache. For example, Anthropic prices cache reads at 10% of the base input price on most models. Caching requires an identical prompt prefix, so put stable content first.

### What is a batch API, and is it cheaper?

A batch API processes many requests asynchronously and returns results later, usually within a day. Anthropic and OpenAI both discount batch processing by 50%, which suits background and bulk work.

### Should I use a smaller AI model to save money?

For many tasks, yes. Classification, extraction and short rewrites often work well on small models that cost a fraction as much. Test each feature against real examples, and route only the hard requests to larger models.

### How do I stop users from running up my AI bill?

Require authentication, enforce per-user rate limits and daily budgets on the server, cap output length and retries, limit agent steps, and set spending alerts below the level that would cause real damage.
:::

:::sources
- [Pricing, Claude API docs](https://docs.anthropic.com/en/docs/about-claude/pricing)
- [Prompt caching, Claude API docs](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Prompt caching, OpenAI API docs](https://developers.openai.com/api/docs/guides/prompt-caching)
- [Prompt caching in the API, OpenAI](https://openai.com/index/api-prompt-caching)
- [Batch API, OpenAI API docs](https://developers.openai.com/api/docs/guides/batch)
:::
