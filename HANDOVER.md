# HAEJOY – Website Handover

Hand-off spec for building the production version of the HAEJOY landing page in **Astro**.
The approved design lives in `prototype/haejoy-prototype.html` (single-file HTML/CSS/JS). Open it in a browser and treat it as the visual and behavioral reference.

---

## 1. Project summary

| | |
|---|---|
| Channel | YouTube **@haejoy** – https://www.youtube.com/@haejoy |
| Channel ID | `UCTaRRSv2Of3QOKLoWwqZsUw` |
| Also on | TikTok `@haejoy` |
| Format | YouTube Shorts, cozy + open-world games, anime-leaning |
| Creator voice | Chill, warm, friendly. Motto: *"make stuff even if it's bad 🤞🏼"* |
| Language | English (site copy) |
| Primary goal | Grow subscribers |
| Secondary goal | Attract sponsors / game collabs |
| Tertiary goal | Fan tips (Saweria, Trakteer, Sociabuzz, Ko-fi, YouTube Membership) |
| Backend | None. Static site only. |

Games currently featured: Heartopia, Petit Planet, Loftia, NTE (Neverness to Everness), Ananta, Sword of Justice, Roblox.

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** (latest stable), `output: "static"` | Zero JS by default, excellent Core Web Vitals, built for content/SEO sites |
| Language | **TypeScript** (`strict` tsconfig preset) | Typed content + components |
| Styling | **Plain CSS** with custom properties, ported from the prototype. Global `src/styles/tokens.css` + `global.css`, component styles scoped in `.astro` files | The prototype is already token-based, so porting is 1:1 with no extra build layer. *(Tailwind v4 via `@tailwindcss/vite` is acceptable if the owner prefers, but map the same tokens into `@theme`.)* |
| Content | **Astro Content Collections** (`src/content.config.ts`, `file()` loader, Zod schemas) | Owner edits JSON, not components |
| Fonts | **Fontsource** self-hosted: `@fontsource/dynapuff`, `@fontsource/nunito`, `@fontsource/shantell-sans` (or Astro's built-in Fonts API if stable in the installed version) | No third-party font request, faster LCP, no layout shift |
| Images | `astro:assets` `<Image />` / `<Picture />` (Sharp) | AVIF/WebP, width/height set, lazy by default |
| YouTube embeds | `@astro-community/astro-embed-youtube` (lite-youtube facade) | Real player only loads on click, so embeds don't hurt performance |
| Interactivity | Vanilla `<script>` inside components (filter chips, theme toggle, "play next" picker, copy email, sparkles canvas, cat easter egg) | No React/Vue needed |
| SEO | `@astrojs/sitemap`, custom `<SEO />` component, JSON-LD, static OG images | See section 5 |
| Icons | Inline SVG components (or `astro-icon`) | No icon font |
| Quality | Prettier + `prettier-plugin-astro`, `astro check`, Lighthouse CI (optional GitHub Action) | |
| Hosting | **Cloudflare Pages** (recommended), or Netlify / Vercel / GitHub Pages | Free static hosting + CDN |
| Analytics | Cloudflare Web Analytics or Umami / Plausible (cookie-less), plus **Google Search Console** | Privacy-friendly, no cookie banner needed |
| Optional data sync | Build-time fetch of latest Shorts via YouTube Data API v3 (`YOUTUBE_API_KEY` env var) + scheduled rebuild (GitHub Action cron or host deploy hook) | Still no backend: data is fetched only during the build. Must fall back to `shorts.json` if the API call fails. |

---

## 3. Project structure

```
haejoy-site/
├─ astro.config.mjs
├─ package.json
├─ tsconfig.json
├─ public/
│  ├─ favicon.svg
│  ├─ apple-touch-icon.png
│  ├─ site.webmanifest
│  ├─ robots.txt                # or generated from src/pages/robots.txt.ts
│  └─ og/                       # 1200x630 OG images (default + one per game)
├─ src/
│  ├─ content.config.ts         # Zod schemas for all collections
│  ├─ content/
│  │  ├─ site.json              # name, tagline, URLs, email, stats
│  │  ├─ games.json
│  │  ├─ shorts.json
│  │  ├─ socials.json
│  │  ├─ support.json           # tip platforms
│  │  └─ schedule.json
│  ├─ assets/                   # mascot, game cover art (licensed/own), thumbnails
│  ├─ styles/
│  │  ├─ tokens.css             # light + dark tokens copied from prototype
│  │  └─ global.css
│  ├─ layouts/
│  │  └─ BaseLayout.astro       # <html lang="en">, <SEO/>, header, footer, theme script
│  ├─ components/
│  │  ├─ SEO.astro
│  │  ├─ JsonLd.astro
│  │  ├─ Header.astro  Footer.astro  ThemeToggle.astro
│  │  ├─ Hero.astro  Mascot.astro
│  │  ├─ ShortsShelf.astro  ShortCard.astro
│  │  ├─ About.astro
│  │  ├─ GameShelf.astro  GameCard.astro
│  │  ├─ CozyCorner.astro       # schedule + "play next" picker
│  │  ├─ Community.astro  Support.astro  LinkCard.astro
│  │  ├─ Collab.astro
│  │  └─ Sparkles.astro         # canvas, disabled for reduced motion
│  └─ pages/
│     ├─ index.astro
│     ├─ games/index.astro
│     ├─ games/[slug].astro     # one SEO page per game
│     ├─ collab.astro           # media-kit style page for sponsors
│     ├─ support.astro          # optional standalone tip page
│     └─ 404.astro
```

---

## 4. Content model (Zod)

```ts
// src/content.config.ts
import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

const games = defineCollection({
  loader: file("src/content/games.json"),
  schema: z.object({
    id: z.string(),                 // slug, e.g. "petit-planet"
    name: z.string(),
    tag: z.enum(["cozy", "open", "roblox"]),
    label: z.string(),              // "Cozy life", "Open world"...
    blurb: z.string(),              // 1 sentence for cards
    description: z.string(),        // 2–4 paragraphs for /games/[slug] (unique text, no thin pages)
    developer: z.string().optional(),
    officialUrl: z.string().url().optional(),
    playlistUrl: z.string().url().optional(),
    order: z.number(),
  }),
});

const shorts = defineCollection({
  loader: file("src/content/shorts.json"),
  schema: z.object({
    id: z.string(),                 // YouTube video ID
    title: z.string(),
    game: z.string(),               // references games.id
    publishedAt: z.coerce.date(),
    description: z.string().optional(),
    featured: z.boolean().default(false),
  }),
});

const links = (path: string) =>
  defineCollection({
    loader: file(path),
    schema: z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      url: z.string().url().or(z.literal("")),   // "" = render as "Coming soon"
      tag: z.string().optional(),               // "Indonesia", "Worldwide", "Monthly"
      tone: z.enum(["sky", "sun", "mint", "coral", "teal"]),
    }),
  });

export const collections = {
  games,
  shorts,
  socials: links("src/content/socials.json"),
  support: links("src/content/support.json"),
};
```

`site.json` and `schedule.json` can be plain imported JSON with a typed interface.

Thumbnails for Shorts: use `https://i.ytimg.com/vi/<id>/hqdefault.jpg` (add `i.ytimg.com` to `image.domains` in `astro.config.mjs` so `<Image />` can optimize it) or the lite-youtube facade.

---

## 5. SEO requirements

### Per-page `<SEO />` component
Props: `title`, `description`, `image?`, `type?` (`website` | `article` | `video.other`), `noindex?`.
Must output:
- `<title>` – pattern: `Page – HAEJOY` (home: `HAEJOY · Cozy Gaming Shorts`)
- `<meta name="description">` – 140–160 chars, unique per page
- `<link rel="canonical">` built from `Astro.site` + path
- Open Graph: `og:title`, `og:description`, `og:image` (1200×630, absolute URL), `og:url`, `og:type`, `og:site_name`, `og:locale` = `en_US`
- Twitter: `twitter:card` = `summary_large_image`
- `<meta name="theme-color">` for light and dark
- favicon, apple-touch-icon, manifest

### Structured data (JSON-LD)
- Home: `WebSite` + `Person` (name "Haejoy", `sameAs` = YouTube, TikTok, and any other filled socials) + `ProfilePage`
- `/games/[slug]`: `VideoGame` (name, url, publisher if known) + `ItemList` of related Shorts as `VideoObject` (name, description, `thumbnailUrl`, `uploadDate`, `embedUrl`, `contentUrl`)
- Breadcrumbs (`BreadcrumbList`) on sub-pages
- Validate with Google Rich Results Test

### Technical
- `site` set in `astro.config.mjs` (real domain) – required for sitemap and canonicals
- `@astrojs/sitemap` → `sitemap-index.xml`; reference it in `robots.txt`
- `<html lang="en">`, exactly one `<h1>` per page, logical `h2/h3` order
- Every image has meaningful `alt`; decorative SVGs are `aria-hidden`
- Clean URLs, trailing-slash policy chosen once (`trailingSlash: "never"` recommended)
- Custom `404.astro`
- No render-blocking third-party scripts. Fonts self-hosted, critical weights preloaded
- Core Web Vitals targets: LCP < 2.0s, CLS < 0.05, INP < 200ms on mobile

### Content SEO
- **One page per game** (`/games/petit-planet`, `/games/heartopia`, …) with unique copy: what the game is, why Haejoy plays it, embedded Shorts, link to playlist. This targets long-tail searches like "Petit Planet cozy shorts" / "Heartopia gameplay shorts".
- `/collab` page doubles as a media kit (audience, formats, contact) – good for brand searches.
- Optional later: `/blog` (Markdown collection) for short cozy-game guides and tier lists, which brings ongoing search traffic.

---

## 6. Page sections (home) – from the prototype

1. **Header** – logo "HAEJOY", anchor links (Shorts, About, Games, Support, Collab), day/night toggle (persist in `localStorage`, wrapped in try/catch; set theme before paint with an inline script in `<head>` to avoid flash).
2. **Hero** – eyebrow, H1 "Come in, grab some tea, let's play something chill.", lede, **Subscribe** (`?sub_confirmation=1`) + **Watch Shorts**, motto sticker, mascot SVG by the window (blinking eyes, tea steam).
3. **Shorts shelf** – horizontal snap-scroll of 9:16 cards from `shorts.json` (newest first), "See all Shorts" link.
4. **About** – intro copy + 4 tilted fact cards.
5. **Game shelf** – filter chips (All / Cozy / Open world / Roblox) + game cards; each card links to `/games/[slug]`.
6. **Cozy corner** – weekly upload schedule (upload days in yellow) + "What should I play next?" picker (localStorage only, nudges to YouTube comments).
7. **Community** – YouTube, TikTok, Instagram, Discord, X. Empty URL ⇒ dashed "Coming soon" card.
8. **Support** – "tip jar" explainer + cards for Saweria, Trakteer, Sociabuzz (tag *Indonesia*), Ko-fi (*Worldwide*), YouTube Membership (*Monthly*).
9. **Collab** – 3 collab formats, optional stats (subs/views/videos), email box with **Copy email** + mailto.
10. **Footer** – thank-you line, clickable cat easter egg.
11. **Sparkles** – fixed canvas of drifting yellow/blue 4-point stars; disabled under `prefers-reduced-motion`.

---

## 7. Build tasks (suggested order)

1. Scaffold: `npm create astro@latest haejoy-site` (minimal template, TypeScript strict). Add `@astrojs/sitemap`, Fontsource packages, `@astro-community/astro-embed-youtube`, Prettier + `prettier-plugin-astro`.
2. Port tokens and global styles from the prototype into `src/styles/`.
3. Create content collections + seed JSON from the prototype's `CONFIG`, `SHORTS`, `GAMES`, `WEEK` arrays.
4. Build `BaseLayout`, `SEO`, `JsonLd`, `Header`, `Footer`, `ThemeToggle`.
5. Build home sections as components, one by one, matching the prototype.
6. Build `/games/index` and `/games/[slug]` with `getStaticPaths()`.
7. Build `/collab` (media kit) and `404`.
8. Add favicon set, manifest, default OG image + one per game.
9. SEO pass: sitemap, robots, JSON-LD validation, Lighthouse ≥ 95 on all four categories.
10. Deploy to Cloudflare Pages, connect domain, submit sitemap to Google Search Console.
11. *(Optional)* Build-time YouTube Data API sync + scheduled rebuild.

---

## 8. Open items for the owner

- [ ] Domain name (e.g. `haejoy.com`) – needed for `site` in config
- [ ] Real Shorts list (video IDs + titles) – prototype uses sample cards
- [ ] Links: Instagram, Discord, X, Saweria, Trakteer, Sociabuzz, Ko-fi, YouTube Membership
- [ ] Collab email address
- [ ] Real upload schedule
- [ ] Channel stats for the collab section (optional)
- [ ] Final mascot/avatar art (current one is a placeholder; do **not** use Bulma or other copyrighted characters)
- [ ] Game art: use own screenshots from Haejoy's videos or official press kits that permit creator use
- [ ] Verify each game's one-line description (especially Loftia)
