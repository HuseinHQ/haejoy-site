// site.json is a single object, so it is validated here instead of as a collection.
import { z } from "astro/zod";
import raw from "../content/site.json";

const optionalUrl = z.url().or(z.literal(""));

export const site = z
  .object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    motto: z.string(),
    youtube: z.url(),
    channelId: z.string(),
    tiktok: optionalUrl,
    email: z.email().or(z.literal("")), // "" = placeholder shown in Collab
    scheduleIsSample: z.boolean(),
    stats: z.object({
      subs: z.string(),
      views: z.string(),
      videos: z.string(),
    }), // "" = hidden
  })
  .parse(raw);

export const subscribeUrl = `${site.youtube}?sub_confirmation=1`;
export const shortsUrl = `${site.youtube}/shorts`;
