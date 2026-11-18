# Rules for working on this repo

## Privacy and legal (the owner lives in Germany: GDPR, TDDDG, MStV apply)
- When you add, remove or change any service that touches visitor or subscriber data
  (analytics, embeds, comments, payments, email tools, new Cloudflare features):
  1. Update `src/pages/privacy.astro` (who, what, why, legal basis, location, retention) and its date.
  2. Tell the owner to update the data map in the project doc `legal-compliance-checklist.md`.
  3. Check the provider's DPA and EU-US transfer basis.
  4. If it sets cookies or tracks visitors, stop and flag the cookie-consent question first.
- Never load third-party resources in the browser (fonts, scripts, images) unless the privacy page covers them
  and `public/_headers` CSP allows them on purpose.
- Never log email addresses or other personal data in `worker/index.ts`.
- Never invent the Impressum name or address. Leave placeholders until the owner provides them.

## Security
- Secrets live only in Cloudflare runtime Variables and Secrets. Never in code, `wrangler.jsonc`, or chat.
- Non-secret config goes in code (`wrangler.jsonc` vars) so deploys cannot erase it.
- Changes reach `main` only through pull requests. Never merge on a red check.

## Working with the owner
- Explanations in ASD-STE100 style (short, simple sentences).
- Be explicit: for every key or value you ask for, say what it is, where to get it, where to paste it, then verify.
- No quizzes unless asked.
