// Every issue is one Markdown file in src/content/issues.
// The schema below checks each file's front matter (the block between the --- lines)
// when the site builds, so a typo like a missing title fails loudly instead of shipping.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const TOPICS = ['Television', 'The World', 'Film', 'Music', 'Politics', 'Books'] as const;

const issues = defineCollection({
  loader: glob({ base: './src/content/issues', pattern: '**/*.md' }),
  schema: z.object({
    number: z.number().int().positive(),
    title: z.string(),
    dek: z.string(), // the one-line summary under the title
    topic: z.enum(TOPICS),
    date: z.coerce.date(),
    readMinutes: z.number().int().positive(),
    cover: z.string().optional(), // path in /public, e.g. /covers/16.svg
    draft: z.boolean().default(false), // drafts never get built
  }),
});

export const collections = { issues };
