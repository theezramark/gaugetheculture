# Gauge the Culture

The website for gaugetheculture.com: an opinionated newsletter on culture and change.
Every issue is one Markdown file. The same file becomes the web page and, later, the email.

## How it fits together

| Part | Tool | Where |
|---|---|---|
| Pages | Astro (turns Markdown into HTML) | `src/` |
| Issues | Markdown files | `src/content/issues/` |
| Hosting | Cloudflare Workers (static files) | `wrangler.jsonc` |
| Sending email | Resend (not wired up yet) | Step 4 |

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

## Deploy

Cloudflare builds and deploys every push to `main`:
- Build command: `npx astro build`
- Deploy command: `npx wrangler deploy`

## Security rules

- **Never commit secrets.** API keys go in Cloudflare (`npx wrangler secret put NAME`), never in files. `.gitignore` already blocks `.env` and `.dev.vars`.
- **Security headers** live in `public/_headers`. The Content Security Policy only allows scripts from this site, which blocks most injected-script attacks.
- **Dependabot** (`.github/dependabot.yml`) opens a pull request when a package has a security fix. Review and merge those.
- **Collect only what you need:** subscriber email, nothing else.

## Not done yet

- Signup form backend (`/api/subscribe`) with Turnstile and double opt-in
- Email template (600 px, same Markdown) and sending through Resend
- RSS feed, social preview image, mobile menu
- Self-hosting the fonts (right now they load from Google Fonts)
- Replace sample copy (marked `SAMPLE COPY`) and add social links in the footer
