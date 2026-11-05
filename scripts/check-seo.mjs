// Post-build SEO guard: run `npm run build && npm run check:seo`.
// Checks every page in dist/ for the rules in HANDOVER.md §5 and fails loudly on the first broken page.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://haejoy.my.id";
const pages = readdirSync("dist", { recursive: true })
  .filter((f) => f.endsWith(".html"))
  .map((f) => join("dist", f));

const errors = [];
const seen = { title: new Map(), description: new Map() };
const meta = (html, re) => html.match(re)?.[1];

for (const file of pages) {
  const html = readFileSync(file, "utf8");
  const err = (msg) => errors.push(`${file}: ${msg}`);
  const is404 = file.endsWith("404.html");

  const title = meta(html, /<title>([^<]*)<\/title>/);
  const description = meta(html, /<meta name="description" content="([^"]*)"/);
  const canonical = meta(html, /<link rel="canonical" href="([^"]*)"/);
  const ogImage = meta(html, /<meta property="og:image" content="([^"]*)"/);

  if (!title) err("missing <title>");
  if (!description) err("missing description");
  else if (description.length < 140 || description.length > 160)
    err(`description is ${description.length} chars`);
  if (!canonical?.startsWith(SITE)) err(`bad canonical: ${canonical}`);
  if (!ogImage?.startsWith(SITE)) err(`bad og:image: ${ogImage}`);
  else if (!existsSync(join("dist", ogImage.slice(SITE.length))))
    err(`og:image file missing: ${ogImage}`);
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1)
    err("must have exactly one <h1>");
  if (!html.includes('<html lang="en"')) err('missing <html lang="en">');
  if (is404 !== html.includes('content="noindex"'))
    err(is404 ? "404 must be noindex" : "unexpected noindex");

  for (const [key, value] of [
    ["title", title],
    ["description", description],
  ]) {
    if (!value) continue;
    if (seen[key].has(value))
      err(`duplicate ${key} (also on ${seen[key].get(value)})`);
    seen[key].set(value, file);
  }

  // Structured data: valid JSON + required fields for the types we emit.
  const nodes = [];
  for (const [, raw] of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  )) {
    try {
      for (const block of [JSON.parse(raw)].flat())
        nodes.push(...(block["@graph"] ?? [block]));
    } catch {
      err("invalid JSON-LD");
    }
  }
  const absolute = (u) => typeof u === "string" && /^https:\/\//.test(u);
  for (const n of nodes) {
    const t = n["@type"];
    if (t === "BreadcrumbList")
      n.itemListElement.forEach((it, i) => {
        if (it.position !== i + 1 || !it.name || !absolute(it.item))
          err(`BreadcrumbList item ${i + 1} incomplete`);
      });
    if (t === "Person" && !(n.name && n.sameAs?.every(absolute)))
      err("Person needs name + absolute sameAs");
    if (t === "VideoGame" && !(n.name && absolute(n.url)))
      err("VideoGame needs name + url");
    if (t === "ItemList")
      for (const { item: v } of n.itemListElement)
        if (!(
          v.name &&
          v.description &&
          absolute(v.thumbnailUrl) &&
          v.uploadDate &&
          absolute(v.embedUrl)
        ))
          err(`VideoObject "${v.name}" incomplete`);
  }
  const types = new Set(nodes.map((n) => n["@type"]));
  if (file === join("dist", "index.html"))
    for (const t of ["WebSite", "Person", "ProfilePage"])
      if (!types.has(t)) err(`home missing ${t}`);
  if (/dist\/games\/.+\.html$/.test(file) && !types.has("VideoGame"))
    err("game page missing VideoGame");
  if (
    file !== join("dist", "index.html") &&
    !is404 &&
    !types.has("BreadcrumbList")
  )
    err("missing BreadcrumbList");
}

const robots = readFileSync("dist/robots.txt", "utf8");
if (!robots.includes(`Sitemap: ${SITE}/sitemap-index.xml`))
  errors.push("robots.txt must reference sitemap-index.xml");
if (!existsSync("dist/sitemap-index.xml"))
  errors.push("sitemap-index.xml missing");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`SEO check passed: ${pages.length} pages`);
