import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const level = z.enum(['beginner', 'intermediate', 'advanced']);

/**
 * Lessons live in src/content/lessons/<section>/<slug>.mdx.
 * The folder name is the section (fundamentals, tutorials, features, mobile, web).
 */
const lessons = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!**/_*.mdx'], base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number().default(100),
    level: level.default('beginner'),
    /** Reading time in minutes. Set `long` only when the lesson uses <Short>/<Long> blocks. */
    minutes: z.object({ short: z.number(), long: z.number().optional() }),
    platform: z.enum(['mobile', 'web', 'both']).default('both'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

/** One page per UI component: src/content/components/<slug>.mdx */
const components = defineCollection({
  loader: glob({ pattern: ['**/*.mdx', '!**/_*.mdx'], base: './src/content/components' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['input', 'navigation', 'feedback', 'content']),
    /** Other names people use for the same thing. */
    aka: z.array(z.string()).default([]),
    platforms: z.array(z.enum(['ios', 'android', 'web'])).default(['ios', 'android', 'web']),
    minutes: z.number(),
    order: z.number().default(100),
    draft: z.boolean().default(false),
  }),
});

/** All glossary terms in one YAML file: src/content/glossary.yaml */
const glossary = defineCollection({
  loader: file('./src/content/glossary.yaml'),
  schema: z.object({
    term: z.string(),
    /** One sentence. Shown in tooltips across the site. */
    short: z.string(),
    definition: z.string(),
    example: z.string().optional(),
    category: z.enum(['process', 'types', 'techniques', 'bugs', 'mobile', 'web', 'ui', 'tools', 'agile']),
    aka: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
  }),
});

/** One file per interview question: src/content/interview/<slug>.md. Body = model answer. */
const interview = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/interview' }),
  schema: z.object({
    question: z.string(),
    /** 1-2 sentence answer, used on flashcards. */
    short: z.string(),
    category: z.enum(['fundamentals', 'process', 'bugs', 'test-design', 'mobile', 'web', 'agile', 'practical', 'behavioral', 'strategy', 'leadership']),
    level: z.enum(['junior', 'mid', 'senior']).default('junior'),
    lookingFor: z.string(),
    pitfalls: z.array(z.string()).default([]),
    order: z.number().default(100),
  }),
});

/**
 * Short review cards for the Bites feed: one YAML file per page,
 * src/content/cards/<section>/<slug>.yaml (e.g. cards/components/button.yaml).
 */
const card = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('quiz'),
    q: z.string(),
    options: z.array(z.string()).min(2).max(4),
    answer: z.number().int().min(0),
    explain: z.string(),
  }),
  z.object({ type: z.literal('truefalse'), statement: z.string(), answer: z.boolean(), explain: z.string() }),
  z.object({
    type: z.literal('thisorthat'),
    prompt: z.string(),
    left: z.string(),
    right: z.string(),
    answer: z.enum(['left', 'right']),
    explain: z.string(),
  }),
  z.object({
    type: z.literal('spotbug'),
    /** A tiny mock screen: 2-6 short lines shown inside a phone-like box. */
    screen: z.array(z.string()).min(1).max(6),
    question: z.string().default("What's wrong here?"),
    bug: z.string(),
    explain: z.string(),
  }),
  z.object({ type: z.literal('flip'), front: z.string(), back: z.string() }),
  z.object({ type: z.literal('tip'), title: z.string(), text: z.string() }),
]);

const cards = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/cards' }),
  schema: z.object({
    /** Optional teaser shown in Discover mode before the page is completed. */
    teaser: z.string().optional(),
    cards: z.array(card).min(1),
  }),
});

export const collections = { lessons, components, glossary, interview, cards };
