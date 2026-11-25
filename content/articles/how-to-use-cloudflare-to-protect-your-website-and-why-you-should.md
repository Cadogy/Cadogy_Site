---
title: "How to protect your website with Cloudflare: a practical setup guide"
description: "Set up Cloudflare properly: SSL modes, locking down your origin, WAF and rate limiting rules on the free plan, bot settings that won't break webhooks, and fixes for 52x errors."
topic: Security
author: charles
tags: [Cloudflare, Web security, DDoS, WAF]
cover:
  image: media/how-to-use-cloudflare-to-protect-your-website-and-why-you-should/cover.jpg
  alt: "Cloudflare logo over a blue-toned photo of fiber-optic strands"
  credit: Photo by S A on Unsplash
  creditUrl: https://unsplash.com/photos/WN0alo23Yhg
  marks: [cloudflare]
---

Putting a site behind Cloudflare takes ten minutes. Putting it behind Cloudflare *properly* takes about an hour, and most sites stop after the first ten minutes.

The gap matters. A proxied site with a reachable origin IP, Flexible SSL and default bot settings is only partly protected. It can also break in confusing ways: redirect loops, payment webhooks that silently fail, and 52x errors nobody can explain.

This guide walks through the setup we'd use for a production web app, in the order that matters, with the fixes for the problems people hit most.

:::summary
- Use **Full (strict)** SSL. Flexible encrypts only half the connection and is the most common cause of redirect loops.
- Proxying hides your origin IP only if the IP was never public. Lock the origin down so it accepts traffic from Cloudflare and nothing else.
- The free plan includes the Free Managed Ruleset, one rate limiting rule and custom rules. Spend the rate limiting rule on your login or signup endpoint.
- Bot Fight Mode can't be bypassed with rules. If you receive webhooks or run an API, test it carefully or use a mode you can skip.
:::

## How Cloudflare protects a site

When a DNS record is proxied (the orange cloud), visitors connect to Cloudflare's network instead of your server. Cloudflare terminates the connection, applies your security rules, serves cached content where it can and forwards the rest to your server, which Cloudflare calls the origin.

That gives you three layers of protection:

1. **Volume.** Network-level DDoS attacks hit Cloudflare's capacity, not your server's.
2. **Filtering.** WAF rules, rate limits and bot detection drop bad requests before they reach your app.
3. **Concealment.** Attackers see Cloudflare's IPs, not yours.

The third layer is the one most setups get wrong, because it only works if your origin can't be reached any other way.

## Step 1: Choose the right SSL mode

In **SSL/TLS → Overview**, you choose how Cloudflare connects to your origin:

| Mode | Visitor → Cloudflare | Cloudflare → origin | Use it? |
|---|---|---|---|
| Off | HTTP | HTTP | No |
| Flexible | HTTPS | HTTP, unencrypted | Avoid |
| Full | HTTPS | HTTPS, certificate not checked | Temporary only |
| Full (strict) | HTTPS | HTTPS, valid certificate required | Yes |

Flexible looks secure to visitors because they see a padlock, but traffic between Cloudflare and your server travels unencrypted. It also causes the most common Cloudflare problem: if your server redirects HTTP to HTTPS, Cloudflare requests over HTTP, gets redirected, requests over HTTP again, and the browser gives up with `ERR_TOO_MANY_REDIRECTS`.

Use **Full (strict)**. Your origin needs a certificate that is valid, unexpired and matches the hostname. A free certificate from Let's Encrypt works, and so does a Cloudflare Origin CA certificate, which Cloudflare trusts and which can be issued for up to 15 years.

:::callout warning
If you still get a redirect loop on Full (strict), something else is redirecting. Check for a forced redirect on the origin, a page or redirect rule in Cloudflare, and your app's own HTTPS settings. WordPress sites often have the site URL set to `http://`.
:::

Then turn on **Always Use HTTPS** and set the **Minimum TLS Version** to 1.2.

A fun detail about the encryption behind all this: Cloudflare feeds part of its randomness from a wall of lava lamps in its San Francisco office.

:::youtube 1cUUfMeOijg
The lava lamps that help keep the internet secure (Tom Scott)
:::

## Step 2: Lock down your origin

Proxying hides your origin IP from DNS lookups. It does not hide it from:

- **Historical DNS.** Services record what your domain pointed to before you moved behind Cloudflare.
- **Other records.** A `mail.` or `ftp.` record that isn't proxied often points at the same server.
- **Your own app.** Outgoing emails, error pages and server-side requests can reveal the IP in headers.
- **Scans.** Attackers scan IP ranges and match TLS certificates to hostnames.

If attackers find the origin, they can send requests straight to it and skip every rule you set up. Cloudflare's own guidance is to rotate the origin IP after onboarding for exactly this reason.

Then make the origin refuse anything that doesn't come through Cloudflare. In order of strength:

1. **Cloudflare Tunnel.** You run a small daemon, `cloudflared`, on the server. It opens outbound-only connections to Cloudflare, so the server needs no public inbound ports at all. This is the strongest option and often the simplest.
2. **Authenticated Origin Pulls.** Cloudflare presents a client certificate on every request, and your server rejects TLS connections without it. Cloudflare's shared certificate proves a request came through Cloudflare, not through *your* account, so upload your own certificate for stronger isolation.
3. **IP allowlisting.** Allow only [Cloudflare's published IP ranges](https://www.cloudflare.com/ips/) at your firewall. It's better than nothing, but Cloudflare itself notes allowlisting alone is weaker than certificate-based checks.

:::callout tip
Managed platforms like Vercel, Netlify or Render already sit behind their own edge network. Before stacking Cloudflare's proxy on top, check the platform's guidance. Some recommend DNS-only mode, and double proxying is a common source of redirect and caching problems.
:::

## Step 3: Turn on the WAF

In **Security → WAF**, the free plan includes:

- **The Free Managed Ruleset**, which Cloudflare maintains to block high-impact, widely exploited vulnerabilities. Turn it on. It needs no tuning.
- **Custom rules** you write with Cloudflare's rule language.
- **One rate limiting rule.**

The broader Cloudflare Managed Ruleset and the OWASP Core Ruleset need a paid plan. For most small sites, the free set plus a few good custom rules covers the common attacks.

Custom rules that earn their place:

```
# Challenge requests to admin and login paths from outside your country
(http.request.uri.path contains "/wp-login.php" or starts_with(http.request.uri.path, "/admin"))
and ip.src.country ne "US"
→ Action: Managed Challenge

# Block requests probing for files that should never be public
(http.request.uri.path contains "/.env" or http.request.uri.path contains "/.git/")
→ Action: Block

# Block known-bad user agents your logs keep showing
(http.user_agent contains "sqlmap" or http.user_agent eq "")
→ Action: Block
```

Adjust the country rule to where your admins actually are. Use **Managed Challenge** rather than Block when real people might match, so they can pass a check instead of hitting a wall.

## Step 4: Rate limit the endpoint attackers care about

The free plan gives you one rate limiting rule, so put it where abuse costs you the most. For most apps, that's login, signup or password reset:

```
When: http.request.uri.path eq "/api/auth/sign-in" and http.request.method eq "POST"
Rate: 5 requests per 10 seconds, counted per IP
Action: Block for 10 seconds
```

Rate limiting at the edge doesn't replace limits in your application. Your app should still lock out repeated failures per account. The edge rule stops the flood before it costs you compute.

## Step 5: Handle bots without breaking your integrations

Cloudflare has two bot tools, and the difference matters:

- **Bot Fight Mode** (free) challenges requests that look automated. You **cannot** skip it with custom rules or page rules, because it runs outside the rules engine.
- **Super Bot Fight Mode** (paid plans) is configurable, and you can exempt paths with a custom rule using the Skip action.

The trap: payment providers, Git hosts and other services call your webhooks from servers, and to bot detection those calls look exactly like bots. If your Stripe or GitHub webhooks start failing after you enable bot protection, this is the first place to look.

If you run an API or receive webhooks, either keep Bot Fight Mode off and rely on rate limits and authentication, or move to a plan with Super Bot Fight Mode and add a skip rule:

```
(starts_with(http.request.uri.path, "/api/webhooks/"))
→ Action: Skip → Super Bot Fight Mode
```

Webhook endpoints should verify the sender's signature anyway. A valid Stripe signature is a much stronger check than any bot score.

## Step 6: Protect forms with Turnstile

CAPTCHAs that make people click on traffic lights hurt conversion. **Turnstile** is Cloudflare's free alternative. It usually runs invisibly, and it works even if your site isn't proxied through Cloudflare.

Add the widget to signup, contact and password reset forms, then verify the token on your server before doing anything. Two details people miss:

- **Verify server-side, every time.** The widget on its own proves nothing. Your server must send the token to Cloudflare's `siteverify` endpoint and check the response.
- **Fail closed in production.** If verification fails or the secret is missing, reject the request. A form that quietly skips the check when misconfigured is worse than no check, because it looks protected.

## Step 7: Cache carefully

Caching takes load off your origin, which is its own form of protection. By default, Cloudflare caches static files like images, CSS and JavaScript, but not HTML.

If you add cache rules for HTML, never cache pages that depend on who is signed in. A cached dashboard served to the wrong visitor is a data leak. Bypass the cache on authenticated paths, or on requests that carry your session cookie.

## Fixing the 52x errors

When something breaks, Cloudflare usually tells you where:

| Error | What it means | Usual fix |
|---|---|---|
| 521 | The origin refused the connection | The server or app is down, or its firewall blocks Cloudflare's IPs |
| 522 | The connection to the origin timed out | Firewall or rate limiting dropping Cloudflare, or an overloaded server |
| 523 | Cloudflare can't reach the origin | The DNS record points to the wrong IP |
| 524 | The origin connected but took too long to respond | A slow request. Optimize it, or move long work to a background job |
| 525 | The SSL handshake with the origin failed | The origin's HTTPS setup is broken or uses unsupported ciphers |
| 526 | The origin certificate is invalid | Expired or mismatched certificate while on Full (strict) |

If you just locked down your origin and suddenly see 521 or 522, your allowlist is probably missing some of Cloudflare's IP ranges.

## A checklist for a new site

1. Proxy the records for your web hostnames. Leave mail records DNS-only.
2. Set SSL to **Full (strict)** with a valid origin certificate.
3. Turn on Always Use HTTPS and set Minimum TLS to 1.2.
4. Lock the origin with Tunnel, Authenticated Origin Pulls or an allowlist, and rotate its IP if it was public before.
5. Enable the Free Managed Ruleset.
6. Add custom rules for admin paths and obvious probes.
7. Spend your rate limiting rule on login or signup.
8. Test webhooks before enabling bot protection.
9. Add Turnstile to public forms and verify it on the server.
10. Keep authenticated pages out of the cache.

:::faq
### Is Cloudflare's free plan enough for a small business website?

For most marketing sites and small apps, yes. It includes DDoS protection, the Free Managed Ruleset, custom WAF rules, one rate limiting rule, Turnstile and a CDN. Paid plans add broader managed rulesets, more rate limiting rules and configurable bot protection, which matter more once you run an API or take payments at scale.

### Why do I get "too many redirects" after enabling Cloudflare?

Almost always because the SSL mode is Flexible while your server forces HTTPS. Switch to Full (strict) with a valid certificate on the origin. If the loop continues, look for redirect rules on the origin or in Cloudflare that conflict.

### Does Cloudflare hide my server's IP address?

Only for proxied records, and only if the IP was never exposed. Historical DNS, unproxied records and outgoing email can all reveal it. Rotate the origin IP after moving behind Cloudflare, and configure the origin to accept traffic only from Cloudflare.

### Will Cloudflare break my Stripe webhooks?

It can, if Bot Fight Mode challenges the requests. Bot Fight Mode can't be skipped with rules. Keep it off on sites that receive webhooks, or use Super Bot Fight Mode with a skip rule for your webhook path, and always verify webhook signatures in your code.

### Should I use Cloudflare in front of Vercel or Netlify?

Check the platform's documentation first. These platforms run their own edge network, and some recommend DNS-only mode in Cloudflare. Stacking two proxies commonly causes redirect loops and confusing cache behavior.
:::

:::sources
- [Too many redirects, Cloudflare SSL docs](https://developers.cloudflare.com/ssl/troubleshooting/too-many-redirects/)
- [Protect your origin server, Cloudflare docs](https://developers.cloudflare.com/fundamentals/basic-tasks/protect-your-origin-server/)
- [Authenticated Origin Pulls, Cloudflare docs](https://developers.cloudflare.com/ssl/origin-configuration/authenticated-origin-pull/)
- [Cloudflare Tunnel, Cloudflare docs](https://developers.cloudflare.com/tunnel/)
- [Cloudflare Web Application Firewall, Cloudflare docs](https://developers.cloudflare.com/waf/)
- [Unmetered rate limiting, Cloudflare blog](https://blog.cloudflare.com/unmetered-ratelimiting/)
- [Bot Fight Mode, Cloudflare learning paths](https://developers.cloudflare.com/learning-paths/modules/get-started/security-free/bot-fight-mode/)
- [Super Bot Fight Mode, Cloudflare docs](https://developers.cloudflare.com/bots/get-started/super-bot-fight-mode/)
- [Cloudflare 5xx errors, Cloudflare docs](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-5xx-errors/)
:::
