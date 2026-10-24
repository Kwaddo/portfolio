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
        confidential: z.boolean().default(false),
        order: z.number(),
        draft: z.boolean().default(false),
        cover: image().optional(),
        coverAlt: z.string().optional(),
      })
      .refine(needsCoverAlt, { message: 'coverAlt is required when cover is set', path: ['coverAlt'] })
      .refine((d) => !(d.confidential && d.cover), { message: 'confidential entries must not have a cover', path: ['cover'] }),
});

const games = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/games' }),
  schema: (ctx) =>
    project(ctx)
      .extend({
        playable: z.enum(['embed', 'external', 'none']).default('none'),
        playUrl: z.url().optional(),
        downloadUrl: z.url().optional(),
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

export const collections = { work, games, lab, about, journeys };
