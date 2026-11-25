---
title: "How to fix Core Web Vitals in Next.js: LCP, INP and CLS"
description: "A practical guide to passing Core Web Vitals in a Next.js app: how Google measures them, the fixes that move LCP, INP and CLS, and how to confirm the improvement with real user data."
topic: Engineering
tags: [Next.js, Core Web Vitals, Performance, SEO]
cover:
  image: media/core-web-vitals-nextjs/cover.jpg
  alt: "Next.js and Lighthouse logos over a blue-toned motion-blur photo"
  credit: Photo by Andrew Lvov on Unsplash
  creditUrl: https://unsplash.com/photos/SggyvR1WFXw
  marks: [nextdotjs, lighthouse]
---

Core Web Vitals are Google's measure of how a page feels to real visitors: how fast the main content shows up, how quickly the page responds when someone taps, and whether things jump around while it loads. They're a ranking signal, and more importantly, slow and jumpy pages lose people.

Next.js gives you good tools for all three, but it won't use them for you. This guide covers how the metrics are measured, the fixes that move each one, and how to check that real users actually got faster.

:::summary
- Google judges your site on the **75th percentile of real visits**, not on a Lighthouse score from your laptop.
- **LCP:** make the largest above-the-fold image load first and fast. In most Next.js apps, that's one prop on one image.
- **INP:** ship less JavaScript and keep event handlers short. Server Components help by keeping code off the client entirely.
- **CLS:** reserve space for everything that loads late: images, fonts, embeds and banners.
- Confirm with field data (Search Console, the Chrome UX Report or your own RUM), because lab tests miss what real devices experience.
:::

## The three metrics and their targets

| Metric | Measures | Good | Poor |
|---|---|---|---|
| **LCP**, Largest Contentful Paint | When the largest visible element finishes rendering | ≤ 2.5 s | > 4 s |
| **INP**, Interaction to Next Paint | How long the page takes to respond visually to clicks, taps and key presses | ≤ 200 ms | > 500 ms |
| **CLS**, Cumulative Layout Shift | How much visible content moves unexpectedly | ≤ 0.1 | > 0.25 |

INP replaced First Input Delay (FID) as a Core Web Vital in March 2024. FID only measured the delay before the *first* interaction. INP measures responsiveness across the whole visit, which is much harder to pass if your page runs heavy JavaScript after it loads.

### Field data is what counts

Google evaluates each metric at the **75th percentile** of real page views, collected from Chrome users in the Chrome UX Report. If 25% of your visitors are on slow phones on weak connections, your score reflects them, not your fast development laptop.

That's why a page can score 100 in Lighthouse and still fail Core Web Vitals in Search Console. Lighthouse is a lab test on a simulated device. It's useful for diagnosing problems, but it isn't the grade.

## Fixing LCP: get the main image on screen first

On most marketing pages and product pages, the LCP element is a hero image. The single most common problem is that the browser discovers it late and loads it lazily.

### 1. Load the LCP image eagerly and at high priority

`next/image` lazy-loads by default, which is right for images below the fold and wrong for the one above it. Tell Next.js which image matters:

```tsx
import Image from "next/image"

<Image
  src="/images/hero.webp"
  alt="Our product dashboard"
  width={1600}
  height={900}
  sizes="(min-width: 1024px) 60vw, 100vw"
  loading="eager"
  fetchPriority="high"
/>
```

In Next.js 16, `loading="eager"` with `fetchPriority="high"` (or the `preload` prop) replaces the older `priority` prop, which earlier versions use for the same job. Mark only the LCP image this way. Prioritizing everything means prioritizing nothing.

### 2. Set `sizes` correctly

Without `sizes`, a responsive image can download a version far larger than the slot it fills. Describe how wide the image actually renders at each breakpoint, and the browser picks the smallest file that looks sharp.

### 3. Don't hide the LCP element behind JavaScript

If the hero only appears after a client component mounts, a carousel initializes or an animation finishes, LCP waits for all of that. Render the first slide as plain server-rendered HTML, and start animations from a visible state rather than from `opacity: 0`.

### 4. Fix slow server responses

LCP can't happen before the HTML arrives. If time to first byte is high, look at what each request waits for: uncached database queries, slow third-party APIs called during render, or pages rendered on demand that could be static or cached. In the App Router, cache data fetches that don't change per request, and pre-render pages that are the same for everyone.

## Fixing INP: do less on the main thread

INP measures the time from an interaction to the next frame the browser paints. If the main thread is busy running JavaScript when someone taps, they wait.

The Chrome team explains how INP is measured and what drives it:

:::youtube KZ1kxzsJZ5g
How to optimize web responsiveness with Interaction to Next Paint (Chrome for Developers)
:::

### 1. Ship less JavaScript

Every kilobyte of client JavaScript has to be downloaded, parsed and run, often on a mid-range phone. In the App Router, components are Server Components by default and send no JavaScript to the browser. Keep it that way:

- Add `"use client"` only to the small interactive leaves, not to whole pages or layouts.
- Move data formatting, markdown rendering and similar work to the server.
- Check your bundles with `@next/bundle-analyzer`, and replace heavy dependencies where a lighter one, or none, will do.

### 2. Keep event handlers short

A click handler that filters 10,000 rows and re-renders a large list blocks the next paint. Give the user instant feedback first, then do the heavy part without blocking:

```tsx
const [query, setQuery] = useState("")
const [isPending, startTransition] = useTransition()

const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  setQuery(event.target.value)
  startTransition(() => setFilter(event.target.value))
}
```

The input updates immediately, and React treats the expensive filter as interruptible background work.

### 3. Tame third-party scripts

Analytics, chat widgets, A/B testing tools and tag managers are a frequent cause of poor INP, because they compete for the main thread on every page. Load them with `next/script` using `strategy="afterInteractive"` or `"lazyOnload"`, question every script's value, and remove the ones nobody looks at.

## Fixing CLS: reserve space for everything

Layout shift happens when something appears and pushes content that was already visible. The fix is always the same: reserve the space before the content arrives.

- **Images:** give every `next/image` a `width` and `height`, or use `fill` inside a container with a fixed aspect ratio. The browser can then reserve the right box before the file loads.
- **Fonts:** load fonts with `next/font`. It self-hosts the files and adjusts the fallback font's metrics to match, so text doesn't reflow when the real font arrives.
- **Embeds and ads:** wrap videos, maps and ad slots in a container with a set aspect ratio or minimum height.
- **Late banners:** cookie notices and promo bars that push the page down shift everything below them. Overlay them, or reserve their space from the first render.
- **Animations:** animate `transform` and `opacity`, not `top`, `height` or `margin`, which move surrounding content.

## Measure what real users experience

Fixes only count once field data improves, and Google's data covers a rolling 28-day window, so expect a delay before Search Console catches up.

1. **Google Search Console → Core Web Vitals** groups your URLs into good, needs improvement and poor, using real Chrome user data.
2. **PageSpeed Insights** shows the Chrome UX Report data for a single URL next to a Lighthouse run, which makes it a good place to compare lab and field results.
3. **Your own real user monitoring.** Next.js exposes the `useReportWebVitals` hook. Send the values to your analytics so you can see results by page and device right after a deploy, without waiting four weeks.

```tsx
"use client"

import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    navigator.sendBeacon("/api/vitals", JSON.stringify(metric))
  })
  return null
}
```

## A checklist for any Next.js page

1. Identify the LCP element on mobile, and load it eagerly at high priority with correct `sizes`.
2. Make sure nothing above the fold waits for client JavaScript to appear.
3. Cache or pre-render whatever doesn't change per request.
4. Keep `"use client"` at the leaves, and audit your client bundle.
5. Load third-party scripts late, and remove the unused ones.
6. Give every image, embed and banner reserved space, and load fonts with `next/font`.
7. Report real-user vitals, and check Search Console after the 28-day window.

:::faq
### What are good Core Web Vitals scores?

An LCP of 2.5 seconds or less, an INP of 200 milliseconds or less, and a CLS of 0.1 or less, each measured at the 75th percentile of real page views.

### Why does my site pass Lighthouse but fail Core Web Vitals?

Lighthouse is a lab test on one simulated device. Core Web Vitals use field data from real Chrome users, including slower phones and networks. Fix what the field data shows, and use Lighthouse to diagnose why.

### What replaced First Input Delay?

Interaction to Next Paint (INP) replaced FID as a Core Web Vital in March 2024. INP measures responsiveness across all interactions during a visit, not just the first one.

### How do I improve LCP in Next.js?

Find the largest above-the-fold element, usually a hero image, and load it eagerly with high fetch priority and a correct sizes attribute. Then make sure nothing delays it, such as client-side rendering, animations that start invisible, or slow server responses.

### How long does it take for Core Web Vitals improvements to show in Search Console?

Search Console uses a rolling 28-day window of real user data, so improvements appear gradually over about four weeks. Use your own real user monitoring to confirm a fix sooner.
:::

:::sources
- [Web Vitals, web.dev](https://web.dev/articles/vitals)
- [How the Core Web Vitals metrics thresholds were defined, web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [Image component, Next.js docs](https://nextjs.org/docs/app/api-reference/components/image)
- [Font optimization, Next.js docs](https://nextjs.org/docs/app/getting-started/fonts)
- [useReportWebVitals, Next.js docs](https://nextjs.org/docs/app/api-reference/functions/use-report-web-vitals)
- [Optimizing Core Web Vitals, Vercel](https://vercel.com/kb/guide/optimizing-core-web-vitals-in-2024)
:::
