import { defineCollection, reference } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

export const tones = ["sky", "sun", "mint", "coral", "teal"] as const;

const games = defineCollection({
  loader: file("src/content/games.json"),
  schema: z.object({
    id: z.string(), // slug, e.g. "petit-planet"
    name: z.string(),
    tag: z.enum(["cozy", "open", "roblox"]),
    label: z.string(), // "Cozy life", "Open world"...
    blurb: z.string(), // 1 sentence for cards
    seoDescription: z.string().min(140).max(160), // meta description for /games/[slug]
    description: z.array(z.string()).min(2).max(4), // paragraphs for /games/[slug]
    developer: z.string().optional(),
    officialUrl: z.url().optional(),
    playlistUrl: z.url().optional(),
    order: z.number(),
  }),
});

const shorts = defineCollection({
  loader: file("src/content/shorts.json"),
  schema: z.object({
    id: z.string(), // YouTube video ID
    title: z.string(),
    game: reference("games"),
    publishedAt: z.coerce.date(),
    description: z.string().optional(),
    featured: z.boolean().default(false),
    sample: z.boolean().default(false), // true = placeholder card, not a real video yet
  }),
});

const links = (path: string) =>
  defineCollection({
    loader: file(path),
    schema: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      url: z.url().or(z.literal("")), // "" = render as "Coming soon"
      tag: z.string().optional(), // "Indonesia", "Worldwide", "Monthly"
      tone: z.enum(tones),
      order: z.number(),
    }),
  });

const schedule = defineCollection({
  loader: file("src/content/schedule.json"),
  schema: z.object({
    id: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
    label: z.string(), // "Short", "Rest", "Chill"
    upload: z.boolean(),
  }),
});

export const collections = {
  games,
  shorts,
  socials: links("src/content/socials.json"),
  support: links("src/content/support.json"),
  schedule,
};
