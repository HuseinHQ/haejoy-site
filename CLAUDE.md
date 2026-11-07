# HAEJOY website

Promo site for the YouTube Shorts gaming channel **@haejoy** (cozy games, anime vibe).
Static site built with **Astro**, no backend. Full spec: `HANDOVER.md`. Visual reference: `prototype/haejoy-prototype.html`.

## Rules
- Read `HANDOVER.md` before starting any task. It is the source of truth for scope, stack, and SEO.
- Match the prototype's look: sky-blue + sunny-yellow palette, chunky 2px outlines, offset "sticker" shadows, clean fonts picked via `FONT_DISPLAY` / `FONT_BODY` in `.env` (choices in `src/fonts.ts`, see `.env.example`). Reuse the CSS tokens from the prototype `:root` blocks, including the dark theme.
- All site copy is **English**.
- Static output only (`output: "static"`). No server endpoints, no database, no client-side framework unless a task truly needs one. Use plain `<script>` in `.astro` components for interactivity.
- Content lives in `src/content/` (JSON) and is typed with Zod in `src/content.config.ts`. Never hard-code games, Shorts, links, or schedule in components.
- Every page uses `src/layouts/BaseLayout.astro` and the `<SEO />` component. No page ships without a unique title, description, canonical URL, and OG image.
- Do not use copyrighted character art (e.g. Bulma / Dragon Ball) or official game logos without permission. Placeholder art is the original chibi mascot in the prototype.
- Respect `prefers-reduced-motion` and keep visible focus states.

## Commands
- `npm run dev` – local dev server
- `npm run build` – production build to `dist/`
- `npm run preview` – serve the build
- `npm run check` – `astro check` (types + diagnostics)
- `npm run format` – Prettier

## Definition of done for any change
1. `npm run check` and `npm run build` pass with no errors.
2. Page still works at 375px width with no horizontal scroll.
3. Lighthouse (mobile) stays ≥ 95 for Performance, Accessibility, Best Practices, SEO.
