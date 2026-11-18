# Gauge the Culture

The website for gaugetheculture.com: an opinionated newsletter on culture and change.
Every issue is one Markdown file. The same file becomes the web page and, later, the email.

## How it fits together

| Part | Tool | Where |
|---|---|---|
| Pages | Astro (turns Markdown into HTML) | `src/` |
| Issues | Markdown files | `src/content/issues/` |
| Hosting | Cloudflare Workers (static files) | `wrangler.jsonc` |
| Signup form | Small Worker server (Turnstile + double opt-in) | `worker/index.ts` |
| Sending email | Resend | API keys stored as Cloudflare secrets |

```
src/
  content.config.ts      rules every issue file must follow (title, number, topic...)
  content/issues/        one .md file per issue
  layouts/Base.astro     the shared frame: <head>, nav, footer
  components/            Nav, Footer, Wordmark (logo), Stamp (cover), Subscribe
  pages/                 index (home), archive, about, 404, issues/[slug] (one per issue)
  styles/global.css      colors, fonts, spacing. Dark is the default theme
public/                  files served as they are: logo, covers, theme.js, _headers
```

## Run it on your computer

```bash
npm install astro@latest          # the site builder
npm install -D wrangler@latest    # Cloudflare's command line tool
npm run dev                       # open http://localhost:4321
```

## Write a new issue

1. Copy `src/content/issues/16-the-horse-in-the-mirror.md` and rename it, e.g. `17-your-title.md`.
2. Change the front matter (the block between the `---` lines) and write the essay below it.
3. Add the stamp cover as `public/covers/17.svg`.
4. Set `draft: true` while you're still writing. Drafts are never published.

## Send an issue by email

1. Merge the issue to `main` (it goes live on the site).
2. On your computer: `git pull`, then `npm run build`.
3. Run `npm run broadcast -- 16-the-horse-in-the-mirror` (the issue's file name without `.md`).
4. Type `yes`, then paste a Resend **Full access** key when asked. Input is hidden and not saved.
5. The script creates a **draft**. Nothing is sent.
6. In Resend > Broadcasts: open the draft, **send yourself a test**, check it in Gmail (light and dark), then press **Send**.
7. After sending: export the subscriber list (CSV) and store it outside Resend.

Rules: open and click tracking stay **off** in Resend (Domains > gaugetheculture.com > Configuration). The email keeps the unsubscribe link; the script refuses to create a draft without it.

## Deploy

Cloudflare builds and deploys every push to `main`:
- Build command: `npx astro build`
- Deploy command: `npx wrangler deploy`

## Privacy rules

- Read `CLAUDE.md`: any new service that touches personal data means updating `src/pages/privacy.astro`.
- The Impressum (`src/pages/impressum.astro`) keeps placeholders until the address is decided.
- Cloudflare request logs are off (`invocation_logs: false`); only our own logs, which never contain emails, are kept.

## Security rules

- **Never commit secrets.** API keys go in Cloudflare (`npx wrangler secret put NAME`), never in files. `.gitignore` already blocks `.env` and `.dev.vars`.
- **Security headers** live in `public/_headers`. The Content Security Policy only allows scripts from this site, which blocks most injected-script attacks.
- **Dependabot** (`.github/dependabot.yml`) opens a pull request when a package has a security fix. Review and merge those.
- **Collect only what you need:** subscriber email, nothing else.
- **Fonts are self-hosted** through Astro's Fonts feature (`astro.config.mjs`). They download once at build time, so visitors never contact Google (GDPR).

## Signup form (double opt-in)

1. The reader submits the form. `worker/index.ts` checks the email, a hidden bot trap and Cloudflare Turnstile.
2. Resend emails them a signed link (works 48 hours). Nothing is saved yet.
3. They open the link and press **Confirm**. Only then is the contact added to Resend.

Secrets (Worker > Settings > Variables and Secrets, type **Secret**):

| Name | What it is |
|---|---|
| `RESEND_SEND_KEY` | Resend key, **Sending access**, limited to gaugetheculture.com |
| `RESEND_CONTACTS_KEY` | Resend key that can add contacts (Full access). Used only after a confirmed click |
| `TURNSTILE_SECRET` | Turnstile widget secret key |
| `SIGNING_KEY` | Long random string. Make one with `openssl rand -base64 48` |

Not secret, so kept in code: the Resend segment ID (`wrangler.jsonc` > `vars`) and the Turnstile **site** key (`src/components/Subscribe.astro`).

Local test: copy `.dev.vars.example` to `.dev.vars`, fill it in, run `npm run preview`.

## Not done yet

- Rate limiting rule on `/api/subscribe` (Cloudflare WAF)
- Email template (600 px, same Markdown) and sending through Resend
- RSS feed, social preview image, mobile menu
- Replace sample copy (marked `SAMPLE COPY`) and add social links in the footer
