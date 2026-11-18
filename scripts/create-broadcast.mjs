#!/usr/bin/env node
// Creates a DRAFT broadcast in Resend from the built email of one issue. It never sends.
// You review the draft in Resend, send yourself a test, then press Send there.
//
// Usage (from the repo folder):
//   npm run build
//   npm run broadcast -- 16-the-horse-in-the-mirror
//
// The Resend API key is typed in hidden (not shown, not saved, not in shell history).
import { readFile } from 'node:fs/promises';
import readline from 'node:readline';

const FROM = 'Gauge the Culture <hello@gaugetheculture.com>';
const REPLY_TO = 'hello@gaugetheculture.com';

const slug = process.argv[2];
if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Give the issue file name without .md, e.g.: npm run broadcast -- 16-the-horse-in-the-mirror');
  process.exit(1);
}

// The segment ID lives in wrangler.jsonc (vars), so there is one source of truth.
const wrangler = JSON.parse((await readFile('wrangler.jsonc', 'utf8')).replace(/^\s*\/\/.*$/gm, ''));
const segmentId = wrangler.vars?.RESEND_SEGMENT_ID;
if (!segmentId) throw new Error('RESEND_SEGMENT_ID missing in wrangler.jsonc vars');

let html;
try {
  html = await readFile(`dist/email/${slug}.html`, 'utf8');
} catch {
  console.error(`dist/email/${slug}.html not found. Run "npm run build" first, and check the issue name.`);
  process.exit(1);
}
if (!html.includes('{{{RESEND_UNSUBSCRIBE_URL}}}')) throw new Error('Email has no unsubscribe link. Not creating a draft.');
const subject = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
if (!subject) throw new Error('No <title> found for the subject line.');

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      process.stdout.write(question);
      rl._writeToOutput = () => {}; // do not echo what is typed
      rl.question('', (a) => { rl.close(); process.stdout.write('\n'); resolve(a.trim()); });
    } else {
      rl.question(question, (a) => { rl.close(); resolve(a.trim()); });
    }
  });
}

console.log('\nAbout to create a DRAFT broadcast (nothing is sent):');
console.log(`  Subject: ${subject}`);
console.log(`  From:    ${FROM}`);
console.log(`  To:      segment ${segmentId}`);
if ((await ask('\nType "yes" to continue: ')).toLowerCase() !== 'yes') {
  console.log('Stopped. Nothing was created.');
  process.exit(0);
}

const key = await ask('Paste the Resend API key (input is hidden): ', true);
if (!/^re_[A-Za-z0-9_]+$/.test(key)) {
  console.error('That does not look like a Resend key (it should start with re_). Nothing was created.');
  process.exit(1);
}

const res = await fetch('https://api.resend.com/broadcasts', {
  method: 'POST',
  headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: `No. ${slug.split('-')[0]}: ${subject}`,
    segment_id: segmentId,
    from: FROM,
    reply_to: REPLY_TO,
    subject,
    html,
    // send is left out on purpose: Resend creates a draft by default.
  }),
});
const data = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Resend said ${res.status}: ${data.message ?? JSON.stringify(data)}`);
  process.exit(1);
}
console.log(`\nDraft created: ${data.id}`);
console.log('Next: open Resend > Broadcasts, open the draft, send yourself a test, then press Send.');
