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
