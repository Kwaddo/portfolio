import { defineCollection, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const person = z.object({ name: z.string(), url: z.url().optional() });
const status = z.enum(['live', 'released', 'prototype', 'showcase', 'archived']);

const project = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    summary: z.string(),
    status,
    lastWorked: z.coerce.date(),
    stack: z.array(z.string()).default([]),
    repoUrl: z.url().optional(),
    collaborators: z.array(person).default([]),
    journey: z.boolean().default(false),
    order: z.number(),
    draft: z.boolean().default(false),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    // the project page shows `cover`; the index cards show `card` when set (e.g. a phone shot on the card, desktop inside)
    card: image().optional(),
    cardAlt: z.string().optional(),
    gallery: z
      .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
      .default([]),
  });

const needsCoverAlt = (d: { cover?: unknown; coverAlt?: string }) => !d.cover || Boolean(d.coverAlt);

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/work' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        role: z.string(),
        period: z.string(),
        stack: z.array(z.string()).default([]),
        summary: z.string(),
        kind: z.enum(['role', 'system']).default('role'),
        confidential: z.boolean().default(false),
        order: z.number(),
        draft: z.boolean().default(false),
        cover: image().optional(),
        coverAlt: z.string().optional(),
        gallery: z
          .array(z.object({ src: image(), alt: z.string(), caption: z.string().optional() }))
          .default([]),
      })
      .refine(needsCoverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] })
      .refine((d) => !(d.confidential && d.cover), { message: 'confidential entries must not have a cover', path: ['cover'] })
      .refine((d) => !(d.confidential && d.gallery.length > 0), { message: 'confidential entries must not have a gallery', path: ['gallery'] }),
});

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: (ctx) =>
    project(ctx)
      .extend({
        playable: z.enum(['embed', 'external', 'none']).default('none'),
        playUrl: z.url().optional(),
        downloadUrl: z.url().optional(),
        frameWidth: z.number().int().positive().optional(),
        frameHeight: z.number().int().positive().optional(),
      })
      .refine((d) => d.playable === 'none' || Boolean(d.playUrl), { message: 'playUrl is required when playable is not none', path: ['playUrl'] })
      .refine(needsCoverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] }),
});

const lab = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lab' }),
  schema: (ctx) =>
    project(ctx)
      .extend({ liveUrl: z.url().optional() })
      .refine(needsCoverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] }),
});

const about = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/about' }),
  schema: z.object({ title: z.string(), order: z.number(), draft: z.boolean().default(false) }),
});

const journeys = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journeys' }),
  schema: z.object({
    project: z.string(),
    order: z.number(),
    title: z.string(),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    project: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

const timeline = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/timeline' }),
  schema: z
    .object({
      start: z.string().regex(/^\d{4}-\d{2}$/),
      end: z.string().regex(/^(\d{4}-\d{2}|present)$/),
      kind: z.enum(['work', 'education', 'project', 'event']),
      title: z.string(),
      org: z.string().optional(),
      summary: z.string().optional(),
      link: z.string().optional(),
      journey: z.boolean().default(false),
      draft: z.boolean().default(false),
    })
    .refine((d) => !(d.journey && d.kind === 'project'), {
      message: 'project timeline entries link to their project page; their journeys live under /personal/',
      path: ['journey'],
    }),
});

export const collections = { work, games, lab, about, journeys, journal, timeline };
