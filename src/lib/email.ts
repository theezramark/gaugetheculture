// Turns one issue (the same Markdown file as the web page) into email-safe HTML.
// Email apps ignore most modern CSS, so: tables for layout, inline styles, 600 px wide,
// no web fonts, no SVG, images as PNG with alt text.
// Resend replaces {{{RESEND_UNSUBSCRIBE_URL}}} with each reader's personal unsubscribe link.
import type { Issue } from './issues';
import { formatDate, issueUrl } from './issues';

const SITE = 'https://gaugetheculture.com';

// Colors from the brand. Light is the base; the dark block below is for email apps that support it.
const C = {
  bg: '#f8fbe9',
  panel: '#eef2dc',
  navy: '#150e2e',
  cream: '#f5fbd9',
  tx: '#150e2e',
  tx2: '#3d3654',
  tx3: '#5c5670',
  acc: '#b04408',
  line: '#d9dcc6',
  orange: '#ff8a3d',
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Arial, sans-serif";

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** Puts the small orange end mark at the end of the last paragraph, like the web page. */
function withEndMark(html: string, mark: string): string {
  const i = html.lastIndexOf('</p>');
  return i === -1 ? html + mark : html.slice(0, i) + mark + html.slice(i);
}

/** Adds inline styles to the simple HTML that Markdown produces. */
function styleBody(html: string): string {
  const p = `margin:0 0 22px;font-family:${SERIF};font-size:18px;line-height:1.65;color:${C.tx}`;
  return (
    html
      .replace(/<!--[\s\S]*?-->/g, '') // drop notes like "SAMPLE COPY"
      .replace(
        /<blockquote>\s*<p>/g,
        `<blockquote style="margin:32px 0;padding:2px 0 2px 20px;border-left:3px solid ${C.orange}"><p class="tx" style="margin:0;font-family:${SERIF};font-size:24px;line-height:1.3;color:${C.tx}">`,
      )
      .replace(/<p>/g, `<p class="tx" style="${p}">`)
      .replace(/<h2([^>]*)>/g, `<h2 class="tx"$1 style="margin:40px 0 14px;font-family:${SERIF};font-weight:normal;font-size:26px;line-height:1.2;color:${C.tx}">`)
      .replace(/<h3([^>]*)>/g, `<h3 class="tx"$1 style="margin:32px 0 10px;font-family:${SERIF};font-weight:normal;font-size:21px;line-height:1.3;color:${C.tx}">`)
      .replace(/<a /g, `<a class="link" style="color:${C.acc};text-decoration:underline" `)
      .replace(/<img /g, '<img style="display:block;width:100%;max-width:560px;height:auto;border:0" ')
      .replace(/<ul>/g, `<ul style="margin:0 0 20px;padding-left:22px;font-family:${SERIF};font-size:18px;line-height:1.65;color:${C.tx}">`)
      .replace(/<ol>/g, `<ol style="margin:0 0 20px;padding-left:22px;font-family:${SERIF};font-size:18px;line-height:1.65;color:${C.tx}">`)
  );
}

export function renderEmail(issue: Issue): string {
  const d = issue.data;
  const body = issue.rendered?.html;
  if (!body) throw new Error(`Issue ${issue.id} has no rendered HTML`);
  const webUrl = SITE + issueUrl(issue);
  const small = `font-family:${SANS};font-size:13px;line-height:1.5;color:${C.tx3}`;
  const endMark = `<span style="display:inline-block;width:10px;height:10px;background:${C.orange};margin-left:6px"></span>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="robots" content="noindex">
<title>${esc(d.title)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .bg { background-color: #150e2e !important; }
    .panel { background-color: #1f1747 !important; }
    .tx { color: #f5fbd9 !important; }
    .tx2 { color: #d9dcc6 !important; }
    .tx3 { color: #b8b3c9 !important; }
    .acc { color: #ff8a3d !important; }
    .link { color: #c4b2f0 !important; }
    .rule { border-color: #3a3166 !important; }
  }
  @media (max-width: 620px) {
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .title { font-size: 32px !important; }
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background-color:${C.bg}">
<!-- Preheader: the grey preview line in the inbox -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(d.dek)}&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.bg}">
<tr><td align="center" style="padding:0 0 40px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">

<!-- Masthead: the navy brand band -->
<tr><td class="pad" style="padding:20px 32px;background-color:${C.navy}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="vertical-align:middle;width:44px"><a href="${SITE}" style="text-decoration:none"><img src="${SITE}/email/stamp-144.png" width="36" height="39" alt="" style="display:block;border:0"></a></td>
    <td style="vertical-align:middle;font-family:${SERIF};font-size:20px;line-height:1;color:${C.cream}"><a href="${SITE}" style="color:${C.cream};text-decoration:none">Gauge the Culture</a></td>
    <td align="right" style="vertical-align:middle;font-family:${SANS};font-size:13px;line-height:1.4;color:#d9dcc6">No. ${d.number} · ${esc(formatDate(d.date))}</td>
  </tr></table>
</td></tr>

<tr><td class="pad" style="padding:36px 32px 0">
  <p class="acc" style="margin:0 0 12px;font-family:${SANS};font-size:14px;font-weight:bold;color:${C.acc}">${esc(d.topic)}</p>
  <h1 class="tx title" style="margin:0 0 14px;font-family:${SERIF};font-weight:normal;font-size:40px;line-height:1.08;color:${C.tx}">${esc(d.title)}</h1>
  <p class="tx2" style="margin:0 0 18px;font-family:${SERIF};font-size:20px;line-height:1.45;color:${C.tx2}">${esc(d.dek)}</p>
  <p class="tx3" style="margin:0;${small}">By Gauge the Culture · ${d.readMinutes} min read · <a class="link" href="${webUrl}" style="color:${C.tx3};text-decoration:underline">Read on the web</a></p>
</td></tr>

<tr><td class="pad" style="padding:28px 32px 0"><div class="rule" style="border-top:1px solid ${C.line};height:1px;line-height:1px;font-size:1px">&nbsp;</div></td></tr>

<tr><td class="pad" style="padding:28px 32px 0">
${withEndMark(styleBody(body), endMark)}
</td></tr>

<!-- Reply box -->
<tr><td class="pad" style="padding:16px 32px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="panel" style="background-color:${C.panel}"><tr><td style="padding:24px">
    <p class="tx" style="margin:0 0 6px;font-family:${SERIF};font-size:22px;line-height:1.25;color:${C.tx}">Did this one land? Argue back.</p>
    <p class="tx2" style="margin:0 0 18px;font-family:${SERIF};font-size:16px;line-height:1.5;color:${C.tx2}">Hit reply and tell us. The best replies are quoted in the next issue.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:${C.orange};border-radius:4px">
      <a href="${webUrl}" style="display:inline-block;padding:13px 22px;font-family:${SANS};font-size:15px;font-weight:bold;line-height:1;color:${C.navy};text-decoration:none">Share the web version</a>
    </td></tr></table>
  </td></tr></table>
</td></tr>

<tr><td class="pad tx3" style="padding:28px 32px 0;${small}">
  <p style="margin:0 0 8px">You get this email because you subscribed at <a class="link" href="${SITE}" style="color:${C.tx3}">gaugetheculture.com</a>. One essay, every other Sunday.</p>
  <p style="margin:0 0 8px"><a class="link" href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:${C.tx3};text-decoration:underline">Unsubscribe</a> · <a class="link" href="${SITE}/privacy/" style="color:${C.tx3}">Privacy</a> · <a class="link" href="${SITE}/impressum/" style="color:${C.tx3}">Impressum</a></p>
  <p style="margin:0">Gauge the Culture</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
