---
title: "Sessions vs. JWTs for web app authentication: which should you use?"
description: "Server sessions and JWTs both work, but they fail differently. A practical comparison covering logout and revocation, XSS and CSRF, scaling, and the setup we recommend for most web apps."
topic: Security
tags: [Authentication, Sessions, JWT, Web security]
cover:
  image: media/sessions-vs-jwt-web-app-authentication/cover.jpg
  alt: "A keyhole in a rusted red steel door"
  credit: Photo by Deleece Cook on Unsplash
  creditUrl: https://unsplash.com/photos/_b8-ZOdA-0c
---

"Should we use sessions or JWTs?" is one of the most argued-about questions in web development, and most of the argument misses what actually matters.

Both can be secure. The difference is in how they fail: what happens when a user clicks "sign out," when an account is compromised, or when a script you didn't write runs on your page. This guide compares the two on those terms and ends with a clear recommendation.

:::summary
- A **session** is a random ID in a cookie that points to a record on your server. A **JWT** is a signed token that carries its own claims.
- Sessions can be revoked instantly. A stateless JWT stays valid until it expires, unless you add server state to revoke it.
- Where you store the credential matters more than which one you pick. Keep it in an `HttpOnly`, `Secure` cookie, not in `localStorage`.
- For a typical web app talking to its own backend, database sessions are simpler and safer. JWTs earn their place between services and in third-party APIs.
:::

## How each one works

**Server sessions.** When a user signs in, the server creates a session record (user ID, expiry, device) and sends the browser a long random session ID in a cookie. On every request, the server looks up that ID. The ID itself means nothing; all the meaning lives on the server.

**JWTs (JSON Web Tokens).** When a user signs in, the server creates a token containing claims such as the user ID, role and expiry, and signs it. On every request, the server verifies the signature and trusts the claims without looking anything up. The token *is* the session.

That one difference, a lookup versus a self-contained token, drives every tradeoff below.

For a walkthrough of both approaches side by side:

:::youtube U6OcC0yq1CE
JSON Web Tokens vs. sessions for authentication (Jan Goebel)
:::

## The tradeoffs that matter

| | Server sessions | Stateless JWTs |
|---|---|---|
| Sign out | Delete the record. Takes effect on the next request | Token stays valid until it expires |
| "Sign out of all devices" | Delete all of the user's records | Needs extra state, like a denylist or token version |
| Role or permission change | Takes effect immediately | Old claims stay in old tokens until they expire |
| Per-request cost | A lookup (fast, and cacheable) | Signature check, no lookup |
| Size on every request | A short ID | Often hundreds of bytes or more |
| Works across separate services | Each needs access to the session store | Any service with the public key can verify |

## Revocation is the deciding issue

Imagine a user's laptop is stolen, or their account is taken over. You want every one of their sessions dead **now**.

With server sessions, you delete their records and the attacker's next request fails. With stateless JWTs, the tokens the attacker already holds keep working until they expire, because nothing on the server says otherwise.

The standard fixes for JWTs all add state back:

- **Short-lived access tokens** (minutes) plus **refresh tokens** stored server-side, so revoking the refresh token cuts access at the next refresh.
- **A denylist** of revoked token IDs that every request checks.
- **A token version** on the user record that's bumped on sign-out, and compared on every request.

Each works. Each also means a lookup per request or a window where a revoked user still has access. At that point you've rebuilt sessions, with more moving parts.

:::callout note
This is why our own platform uses database sessions. When an owner changes someone's role, our role service revokes that person's sessions, so the change takes effect on their very next request rather than whenever a token happens to expire.
:::

## Where the credential lives matters more

The most common real-world failure isn't sessions versus JWTs. It's storing either one somewhere JavaScript can read it.

**`localStorage` is readable by any script on your page.** One cross-site scripting (XSS) bug, whether in your code, a dependency or a third-party widget, and an attacker can read the token and use it from anywhere until it expires.

An **`HttpOnly` cookie** can't be read by JavaScript at all. An XSS bug can still make requests from the victim's browser while they're on the page, which is serious, but it can't steal the credential and replay it later from somewhere else.

OWASP's guidance for session cookies:

```
Set-Cookie: __Host-session=<random id>; Path=/; Secure; HttpOnly; SameSite=Lax
```

- **`HttpOnly`** keeps scripts from reading it.
- **`Secure`** sends it only over HTTPS.
- **`SameSite=Lax`** (or `Strict`) stops most cross-site request forgery by withholding the cookie from requests other sites trigger.
- **The `__Host-` prefix** tells the browser to accept the cookie only if it's `Secure`, has `Path=/` and no `Domain`, which blocks subdomains from overwriting it.

These rules apply to a JWT too, if you use one. A JWT in an `HttpOnly` cookie is far safer than a session ID in `localStorage`.

## Session security checklist

Whichever you choose:

1. **Generate IDs with a cryptographically secure generator**, with at least 128 bits of randomness. Never use the user ID or a timestamp.
2. **Rotate the session ID when privilege changes**, especially right after sign-in. This prevents session fixation.
3. **Expire on two clocks**: an idle timeout (no activity for a while) and an absolute timeout (a hard maximum). How long depends on how sensitive the app is.
4. **Store a hash of the session ID** in your database, not the raw value, so a leaked database backup doesn't hand out live sessions.
5. **Let users see and end their sessions**, with device and last-active details, plus "sign out everywhere."
6. **Revoke all sessions on password change** and on any role or permission change.

## When JWTs are the right tool

JWTs shine where a central session lookup is awkward:

- **Service-to-service calls**, where one service vouches for a request to another.
- **Third-party APIs**, where clients you don't control need a credential they can send.
- **Short-lived, single-purpose tokens**: an email verification link, a file download URL or an OAuth access token from an identity provider.

The common thread is short lifetimes and limited scope, where "can't revoke instantly" doesn't matter much.

## What we recommend

For a web app whose frontend talks to its own backend, which covers most SaaS products, dashboards and marketplaces:

- **Database sessions** with a random ID in a `__Host-`, `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- **A short-lived signed cookie cache** in front of the session lookup if performance demands it. You keep near-instant revocation and skip most database reads.
- **JWTs only at the edges**: between services, for third-party API clients and for single-use links.

You get instant sign-out, simple "sign out everywhere," permission changes that apply immediately, and no tokens sitting in JavaScript-readable storage.

:::faq
### Are JWTs more secure than sessions?

No. Neither is inherently more secure. Sessions are easier to revoke instantly, while stateless JWTs stay valid until they expire. Storage matters most: keep either one in an HttpOnly, Secure cookie rather than in localStorage.

### Can you log out a user with a JWT?

Not instantly with a purely stateless JWT, because the server doesn't track it. You need extra state, such as short-lived access tokens with server-side refresh tokens, a denylist of revoked tokens, or a per-user token version checked on each request.

### Is it safe to store a JWT in localStorage?

It's risky. Any script running on your page, including one injected through an XSS bug, can read localStorage and steal the token. An HttpOnly cookie can't be read by JavaScript.

### Do sessions scale?

Yes. A session lookup is a single indexed read, and it can be cached. Large applications run on server sessions. The scaling cost is usually far smaller than the operational cost of building revocation on top of JWTs.

### What SameSite setting should a session cookie use?

Lax is a good default for most apps: it blocks most cross-site request forgery while keeping normal links into your site working. Use Strict for highly sensitive apps where the cookie never needs to be sent on navigation from other sites.
:::

:::sources
- [Session Management Cheat Sheet, OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Testing for cookie attributes, OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/06-Session_Management_Testing/02-Testing_for_Cookies_Attributes)
- [Secure cookie configuration, MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Cookies)
- [Session management, MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Session_management)
- [The stateless JWT logout problem, WorkOS](https://workos.com/blog/stateless-jwt-logout-problem)
:::
