// Gauge the Culture: the small server behind the signup form.
//
// Flow (double opt-in):
//   1. POST /api/subscribe  : check the form + Turnstile, then email a signed confirm link
//   2. GET  /api/confirm    : show a "Confirm" button (link scanners open links, they don't press buttons)
//   3. POST /api/confirm    : check the signature, then add the person to Resend
// Everything that isn't /api/* is served straight from the static site and never reaches this file.
//
// Privacy rule: never log email addresses.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  RESEND_SEND_KEY: string; // Resend key with "Sending access" only, limited to gaugetheculture.com
  RESEND_CONTACTS_KEY: string; // Resend key that can add contacts. Used only after a confirmed click
  RESEND_SEGMENT_ID: string; // the Resend segment new subscribers join
  TURNSTILE_SECRET: string; // Turnstile secret key
  SIGNING_KEY: string; // long random string that signs confirm links
}

const SITE = 'https://gaugetheculture.com';
const FROM = 'Gauge the Culture <hello@gaugetheculture.com>';
const ALLOWED_HOSTS = ['gaugetheculture.com', 'www.gaugetheculture.com', 'localhost'];
const LINK_LIFETIME_SECONDS = 48 * 60 * 60; // confirm links work for 48 hours

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer', // the confirm link carries a token: never leak it
  'X-Robots-Tag': 'noindex',
  'Cache-Control': 'no-store',
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    try {
      if (url.pathname === '/api/subscribe' && request.method === 'POST') return await subscribe(request, env);
      if (url.pathname === '/api/confirm' && request.method === 'GET') return confirmPage(url);
      if (url.pathname === '/api/confirm' && request.method === 'POST') return await confirm(request, env);
      return new Response('Not found', { status: 404, headers: SECURITY_HEADERS });
    } catch (err) {
      console.error('signup error:', err instanceof Error ? err.message : 'unknown');
      return redirect('/oops/');
    }
  },
};

// ---------------------------------------------------------------- 1. subscribe
async function subscribe(request: Request, env: Env): Promise<Response> {
  // Only accept form posts that come from our own pages.
  const origin = request.headers.get('Origin');
  if (origin && !ALLOWED_HOSTS.includes(new URL(origin).hostname)) return redirect('/subscribe-error/');

  const form = await request.formData();

  // Honeypot: a hidden field people never see. Bots fill it in. Pretend it worked.
  if (String(form.get('website') ?? '') !== '') return redirect('/check-your-email/');

  const email = String(form.get('email') ?? '').trim().toLowerCase();
  if (!isValidEmail(email)) return redirect('/subscribe-error/');

  const human = await checkTurnstile(String(form.get('cf-turnstile-response') ?? ''), request, env);
  if (!human) return redirect('/subscribe-error/');

  const token = await sign({ e: email, x: Math.floor(Date.now() / 1000) + LINK_LIFETIME_SECONDS }, env.SIGNING_KEY);
  const link = `${SITE}/api/confirm?t=${encodeURIComponent(token)}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_SEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [email],
      subject: 'Confirm your subscription to Gauge the Culture',
      html: confirmEmailHtml(link),
      text: `Confirm your subscription to Gauge the Culture:\n\n${link}\n\nThis link works for 48 hours. If you didn't sign up, ignore this email and nothing happens.`,
    }),
  });
  if (!res.ok) {
    console.error('resend send failed:', res.status);
    return redirect('/oops/');
  }
  // Same answer whether or not this person already subscribed, so nobody can probe who is on the list.
  return redirect('/check-your-email/');
}

async function checkTurnstile(token: string, request: Request, env: Env): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: request.headers.get('CF-Connecting-IP') ?? undefined,
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean; hostname?: string; action?: string };
  return data.success === true && ALLOWED_HOSTS.includes(data.hostname ?? '') && data.action === 'subscribe';
}

// ---------------------------------------------------------------- 2. confirm page (GET)
function confirmPage(url: URL): Response {
  const token = url.searchParams.get('t') ?? '';
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirm your subscription | Gauge the Culture</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#150e2e;color:#f5fbd9;font-family:Georgia,serif;text-align:center;padding:24px}
  h1{font-weight:400;font-size:40px;margin:0 0 12px}
  p{color:rgba(245,251,217,.82);font-size:18px;margin:0 0 28px}
  button{height:52px;padding:0 28px;border:0;border-radius:3px;background:#f5fbd9;color:#150e2e;font:600 15px Arial,sans-serif;cursor:pointer}
</style></head>
<body><main>
  <h1>One last step</h1>
  <p>Press the button to confirm your subscription to Gauge the Culture.</p>
  <form method="post" action="/api/confirm">
    <input type="hidden" name="t" value="${escapeHtml(token)}">
    <button type="submit">Confirm subscription</button>
  </form>
</main></body></html>`;
  return new Response(html, {
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    },
  });
}

// ---------------------------------------------------------------- 3. confirm (POST)
async function confirm(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const payload = await verify(String(form.get('t') ?? ''), env.SIGNING_KEY);
  if (!payload) return redirect('/confirm-failed/');

  const res = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_CONTACTS_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: payload.e,
      unsubscribed: false,
      segments: [{ id: env.RESEND_SEGMENT_ID }],
    }),
  });
  if (res.ok || res.status === 409) return redirect('/welcome/');
  console.error('resend contact failed:', res.status);
  return redirect('/oops/');
}

// ---------------------------------------------------------------- helpers
function redirect(path: string): Response {
  return new Response(null, { status: 303, headers: { ...SECURITY_HEADERS, Location: path } });
}

function isValidEmail(email: string): boolean {
  return email.length >= 6 && email.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(email);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

// Signed links: base64url(JSON) + "." + HMAC-SHA256 signature. Anyone can read the email inside,
// but nobody can change it or make a new link without SIGNING_KEY.
const enc = new TextEncoder();

function toB64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array {
  let b = s.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return Uint8Array.from(atob(b), (c) => c.charCodeAt(0));
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

async function sign(payload: { e: string; x: number }, secret: string): Promise<string> {
  const body = toB64url(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  return `${body}.${toB64url(sig)}`;
}

async function verify(token: string, secret: string): Promise<{ e: string; x: number } | null> {
  if (!token || token.length > 1000) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  try {
    // crypto.subtle.verify compares in constant time, so timing can't leak the signature.
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromB64url(sig), enc.encode(body));
    if (!ok) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body)));
    if (typeof p.e !== 'string' || !isValidEmail(p.e) || typeof p.x !== 'number') return null;
    if (p.x < Date.now() / 1000) return null; // expired
    return { e: p.e, x: p.x };
  } catch {
    return null;
  }
}

function confirmEmailHtml(link: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f8fbe9;font-family:Georgia,serif;color:#150e2e">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:600px" cellpadding="0" cellspacing="0">
<tr><td style="font-size:32px;line-height:1.2;padding-bottom:16px">Confirm your subscription</td></tr>
<tr><td style="font-size:18px;line-height:1.6;color:#3d3654;padding-bottom:28px">You asked to get Gauge the Culture, an opinionated newsletter on culture and change. Press the button to confirm. The link works for 48 hours.</td></tr>
<tr><td style="padding-bottom:28px"><a href="${link}" style="display:inline-block;background:#150e2e;color:#f5fbd9;text-decoration:none;font:600 15px Arial,sans-serif;padding:16px 28px;border-radius:3px">Confirm subscription</a></td></tr>
<tr><td style="font-size:14px;line-height:1.5;color:#5c5670">If you didn't sign up, ignore this email and nothing happens.</td></tr>
</table></td></tr></table></body></html>`;
}
