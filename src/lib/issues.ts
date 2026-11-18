import { getCollection, type CollectionEntry } from 'astro:content';

export type Issue = CollectionEntry<'issues'>;

/** All published issues, newest first. (getCollection's order is not guaranteed, so we sort.) */
export async function getIssues(): Promise<Issue[]> {
  const all = await getCollection('issues', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.number - a.data.number);
}

export function issueUrl(issue: Issue): string {
  return `/issues/${issue.id}/`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

/** Two-digit issue number, e.g. 8 -> "08". */
export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Color of the number printed on each topic's stamp cover. */
export const STAMP_NUMBER_COLOR: Record<string, string> = {
  Television: '#150e2e',
  'The World': '#150e2e',
  Film: '#f5fbd9',
  Music: '#f5fbd9',
  Politics: '#f5fbd9',
  Books: '#150e2e',
};

/** Plain text of the first paragraphs of an issue (for the home page excerpt). */
export function excerpt(issue: Issue, count = 2): string[] {
  const blocks = (issue.body ?? '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !/^(#|>|!\[|[-*] |\d+\. |<)/.test(b));
  return blocks.slice(0, count).map((b) => b.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_`]/g, '').replace(/\s+/g, ' '));
}

/** The first pull quote (a "> " line) of an issue, if it has one. */
export function pullQuote(issue: Issue): string | undefined {
  const m = (issue.body ?? '').match(/^>\s?(.+)$/m);
  return m ? m[1].replace(/[*_`]/g, '').trim() : undefined;
}

export const ARROW = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
