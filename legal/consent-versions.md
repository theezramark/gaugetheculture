# Consent wording versions

Proof of consent (GDPR Art. 7(1)) needs the exact wording a subscriber saw.
Each confirmed signup in the D1 table `consents` stores a version ID from this file.
Never edit an old version. When wording changes, add a new section and bump the constant in `worker/index.ts`.

---

## form-2026-11-18 (signup form, `src/components/Subscribe.astro`)

> **One essay, every other Sunday.**
> Long opinions on television, film, books, music and the world, sent to your inbox. Every issue also lives here.
> [Email address] [Subscribe]
> Free. We only store your email. You'll get one email to confirm. Unsubscribe any time. Details in our privacy policy (link to /privacy/).

## confirm-email-2026-11-18 (confirm email, `worker/index.ts`)

From: Gauge the Culture <hello@gaugetheculture.com>
Subject: Confirm your subscription to Gauge the Culture

> **Confirm your subscription**
> You asked to get Gauge the Culture, an opinionated newsletter on culture and change. Press the button to confirm. The link works for 48 hours.
> [Confirm subscription] (link to https://gaugetheculture.com/api/confirm?t=<signed token>)
> If you didn't sign up, ignore this email and nothing happens.

Confirm page (after the link): "One last step. Press the button to confirm your subscription to Gauge the Culture." [Confirm subscription]
