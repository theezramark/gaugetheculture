// Builds the email version of each issue at /email/<issue-id>.html.
// scripts/create-broadcast.mjs reads this file and creates a DRAFT broadcast in Resend.
import type { APIRoute, GetStaticPaths } from 'astro';
import { getIssues, type Issue } from '../../lib/issues';
import { renderEmail } from '../../lib/email';

export const getStaticPaths = (async () => {
  const issues = await getIssues();
  return issues.map((issue) => ({ params: { slug: issue.id }, props: { issue } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) =>
  new Response(renderEmail((props as { issue: Issue }).issue), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
