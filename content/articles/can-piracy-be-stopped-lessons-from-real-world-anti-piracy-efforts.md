---
title: "Can piracy be stopped? What actually works for digital products"
description: "You can't stop piracy, but you can make it unprofitable. What the evidence says about DRM, watermarking, license checks and account sharing, and how to protect a digital product without punishing paying customers."
topic: Security
tags: [Piracy, Content protection, DRM, Licensing]
---

If you sell something digital, such as software, a course, an ebook, a game or a stock asset, someone will eventually share it for free. That isn't a sign you did something wrong. It's a sign people want what you made.

The useful question isn't "how do I stop piracy?" You can't. Anything a paying customer can see or run, a determined person can copy. The useful questions are how much piracy actually costs you, which defenses change the math, and which ones mostly punish the people who paid.

:::summary
- No protection is unbreakable. Good protection makes copying slower, riskier or less convenient than buying.
- The strongest evidence on DRM suggests it protects revenue mainly in the first weeks after launch, when most sales happen.
- Keep anything valuable on your servers. Content and features you never ship to the client can't be copied from the client.
- Per-buyer watermarking doesn't prevent leaks, but it tells you who leaked and discourages casual sharing.
- Convenience is a defense. Many people pirate because buying is harder than not buying.
:::

## What the evidence says about DRM

The most-cited recent study on this comes from video games, where DRM is common and crack dates are public. In 2024, William Volckmann published an analysis in *Entertainment Computing* of 86 games protected by Denuvo, a widely used anti-tamper system, released on Steam between 2014 and 2022.

Its findings, as reported in coverage of the study:

- When protection was cracked early, games lost revenue. The study estimates Denuvo protected a mean of about 15% and a median of about 20% of total revenue.
- When protection held for about 12 weeks or more, the study found no meaningful revenue loss from piracy. By then, most of a game's sales had already happened.
- Nothing reliably predicted how quickly a game would be cracked. Popularity, price and genre didn't.

The study had to estimate sales indirectly, from Steam reviews and player counts, so treat the numbers as directional. But the shape of the result is useful well beyond games: **protection matters most while demand is highest.** For most digital products, that's the launch window.

There's also a cost on the other side. Heavy DRM can slow things down, break offline use and lock out paying customers whose setup it doesn't expect. Those customers notice. Some of them become the loudest critics of your product.

## Piracy is often a service problem

Valve's Gabe Newell put it bluntly in 2011: "Piracy is almost always a service problem and not a pricing problem." His argument was that people pirate when the legitimate option is worse: delayed in their region, locked to one device, or harder to use than the copy.

Netflix's password sharing crackdown is a useful counterexample with the same lesson. After it started enforcing household sharing, Netflix added about 5.9 million subscribers in the second quarter of 2023, close to three times what analysts expected. The crackdown worked because it came with a cheap ad-supported plan and a paid option to add an extra member. Enforcement plus an easy legitimate path converted sharers into customers. Enforcement alone tends to just annoy them.

So before adding protection, fix the buying experience:

- **Instant access** after payment, on every device the customer owns.
- **Fair regional pricing**, if you sell internationally.
- **No artificial friction** for paying customers, like aggressive device limits or forced always-online checks for offline content.
- **A clear way to share legitimately**, such as team or family plans, if sharing is common.

## Defenses that work, by product type

### Software and apps: keep the value on the server

The most effective protection for software is architectural. **Code you never ship can't be cracked.** If the valuable part of your product runs on your servers, such as data, processing, AI features or sync, a pirated client is worth very little.

For apps that must run locally, use license keys that your server signs and the app verifies:

1. On purchase, your server issues a license containing the customer ID, plan and expiry, signed with a private key.
2. The app verifies the signature with the matching public key. It can do this offline.
3. The app checks in with your server periodically to catch revoked or shared keys.

```ts
import { createPublicKey, verify } from "node:crypto"

const publicKey = createPublicKey(process.env.LICENSE_PUBLIC_KEY!)

export const isValidLicense = (payload: string, signature: string) =>
  verify(null, Buffer.from(payload), publicKey, Buffer.from(signature, "base64"))
```

Asymmetric signatures (Ed25519, for example) matter here. The app ships with the public key, which can only verify. The private key that creates licenses never leaves your server. A cracker can patch the check out of the app, but can't generate licenses that pass it.

### Downloads and files: short-lived, signed links

If you sell files, never expose a permanent download URL. Generate a signed link that expires quickly and is tied to the buyer:

```ts
import { createHmac } from "node:crypto"

export const signedDownloadUrl = (fileId: string, buyerId: string) => {
  const expires = Math.floor(Date.now() / 1000) + 10 * 60
  const signature = createHmac("sha256", process.env.DOWNLOAD_SECRET!)
    .update(`${fileId}:${buyerId}:${expires}`)
    .digest("base64url")
  return `/downloads/${fileId}?buyer=${buyerId}&expires=${expires}&sig=${signature}`
}
```

The download route recomputes the signature, rejects expired links, and logs each download per buyer. Most object storage, including S3 and Cloudflare R2, supports presigned URLs that do the same at the storage layer. Rate limit downloads per account too. One buyer downloading a file 400 times in a day is a signal worth acting on.

### Courses, ebooks and documents: per-buyer watermarking

Watermarking doesn't stop copying. It makes copying traceable. Stamp each copy with something unique to the buyer:

- **Visible stamps**, like "Licensed to jane@example.com" in a PDF footer. These discourage casual sharing, because people don't like passing around files with their email on them.
- **Forensic watermarks**, invisible identifiers embedded in video or images. These survive re-encoding and screenshots, and let you trace a leaked copy back to an account.

Be realistic about the limits. Visible stamps can be cropped. Forensic watermarking costs more, because each viewer gets a unique copy, and researchers have shown that several people combining copies can make tracing harder. It's most worth it for high-value video and pre-release content.

### Subscriptions: detect sharing, then offer a path

For subscription products, credential sharing is usually the bigger leak, not piracy in the classic sense. Useful signals:

- Simultaneous active sessions from distant locations.
- More devices than any one person plausibly uses.
- A single account streaming or downloading around the clock.

Respond with friction proportional to the evidence: ask for re-verification, cap concurrent sessions, then offer an upgrade to a team or family plan. Banning accounts outright turns sharers, who were potential customers, into angry former customers.

## Takedowns: worth doing, in moderation

When copies appear publicly, the DMCA notice-and-takedown process works for removing them from hosts and from search results. Google accepts removal requests for search results that link to infringing copies, which matters more than the file itself. Most people find pirated copies by searching for your product name plus "free."

Takedowns are whack-a-mole, so spend time where it pays off: the top few search results for your product name, and the sites that show up there repeatedly. Monitoring tools and agencies can automate this if the volume justifies it.

## A practical playbook

1. **Make buying easier than pirating.** Instant access, fair prices, every device.
2. **Move value server-side** wherever the product allows it.
3. **Sign licenses** with a private key the client never sees.
4. **Use short-lived signed URLs** for every file download.
5. **Watermark per buyer**, visibly for documents and forensically for high-value video.
6. **Watch for sharing signals** and respond with a path to pay, not just a block.
7. **Concentrate protection on launch**, when it protects the most revenue.
8. **File takedowns** where they affect discovery, and accept that some copying will always happen.

:::faq
### Can piracy be completely stopped?

No. Anything a paying customer can access, a determined person can copy. The realistic goal is to make piracy less convenient than buying and to protect revenue during the period when it matters most.

### Does DRM increase sales?

The best recent evidence suggests DRM protects revenue mainly in the first weeks after launch, if it isn't cracked quickly. After about 12 weeks, the effect largely disappears. It can also hurt paying customers through performance problems and compatibility issues.

### What is the best way to protect a digital course from piracy?

Host videos on a platform that streams rather than offering downloads, use signed and expiring links, watermark each buyer's copy and watch for accounts with unusual viewing patterns. Pair that with fair pricing and instant access, which removes many reasons to pirate in the first place.

### How do license keys stop software piracy?

Signed license keys let an app verify, even offline, that a license was issued by you. Because the signing key stays on your server, nobody can generate valid keys. A cracker can still patch the check out of the app, which is why keeping valuable features on the server is the stronger defense.

### Is it worth sending DMCA takedown notices?

Yes, selectively. Focus on the copies that rank in search results for your product name, since that's where most people find them. Removing a link from search results often matters more than removing the file itself.
:::

:::sources
- [Publishers face 20% game revenue reduction if Denuvo DRM is cracked quickly, Tom's Hardware](https://www.tomshardware.com/video-games/publishers-face-20-percent-game-revenue-reduction-if-denuvo-drm-is-cracked-quickly-according-to-new-study)
- [Early Denuvo cracks lead to 20% drop in video game revenue, TechSpot](https://www.techspot.com/news/105124-early-denuvo-cracks-lead-20-video-game-revenue.html)
- [Gabe Newell: piracy is almost always a service problem, Gamewatcher](https://www.gamewatcher.com/news/2011-28-11-newell-piracy-is-almost-always-a-service-problem-and-not-price-drm-agitates)
- [Netflix added nearly 6 million new subscribers amid password sharing crackdown, Engadget](https://www.engadget.com/netflix-added-nearly-6-million-new-subscribers-amid-password-sharing-crackdown-204411234.html)
- [Forensic watermarking explained, Cloudinary](https://cloudinary.com/guides/video/forensic-watermarking)
:::
