// 1200x630 Open Graph images, rendered at build time: /og/default.png + /og/games/<id>.png
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { readFile } from "node:fs/promises";
import satori from "satori";
import sharp from "sharp";

const tones = {
  default: "#F2F8FF",
  cozy: "#FFEDB0",
  open: "#C9E8FA",
  roblox: "#CBF0E6",
};

export const getStaticPaths = (async () => {
  const games = await getCollection("games");
  return [
    {
      params: { slug: "default" },
      props: {
        eyebrow: "cozy gaming Shorts",
        title: "Come in, grab some tea, let's play something chill.",
        bg: tones.default,
      },
    },
    ...games.map((g) => ({
      params: { slug: `games/${g.id}` },
      props: {
        eyebrow: g.data.label,
        title: `${g.data.name} Shorts`,
        bg: tones[g.data.tag],
      },
    })),
  ];
}) satisfies GetStaticPaths;

const font = (pkg: string, file: string) =>
  readFile(`node_modules/@fontsource/${pkg}/files/${file}`);

// The mascot SVG is taken straight from Mascot.astro with light-theme token values filled in.
let mascotCache: Promise<string> | undefined;
async function mascotPng() {
  const [component, tokens] = await Promise.all([
    readFile("src/components/Mascot.astro", "utf8"),
    readFile("src/styles/tokens.css", "utf8"),
  ]);
  const light = tokens.slice(0, tokens.indexOf("@media"));
  const vars = Object.fromEntries(
    [...light.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [
      m[1],
      m[2]!.trim(),
    ]),
  );
  const svg = component
    .match(/<svg[\s\S]*<\/svg>/)![0]
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace(/var\(--([\w-]+)\)/g, (_, k: string) => vars[k] ?? "#000");
  const png = await sharp(Buffer.from(svg), { density: 216 })
    .resize(440)
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

type Node = { type: string; props: Record<string, unknown> };
const h = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  extra = {},
): Node => ({
  type,
  props: { style, children, ...extra },
});

export const GET: APIRoute = async ({ props }) => {
  const { eyebrow, title, bg } = props as {
    eyebrow: string;
    title: string;
    bg: string;
  };
  const [dyna, nunito, mascot] = await Promise.all([
    font("dynapuff", "dynapuff-latin-700-normal.woff"),
    font("nunito", "nunito-latin-800-normal.woff"),
    (mascotCache ??= mascotPng()),
  ]);
  const ink = "#132F47";

  const tree = h(
    "div",
    // Satori sizes are content-box: padding and borders are added on top of width/height.
    {
      width: 1120, // + 2*40 padding = 1200
      height: 550, // + 2*40 padding = 630
      display: "flex",
      background: bg,
      padding: 40,
      fontFamily: "Nunito",
      color: ink,
    },
    h(
      "div",
      {
        // outer box 1108x538 (leaves 12px for the shadow) minus 12 border and 96/80 padding
        width: 1000,
        height: 446,
        display: "flex",
        alignItems: "center",
        background: "#FFFFFF",
        border: `6px solid ${ink}`,
        borderRadius: 48,
        boxShadow: `12px 12px 0 ${ink}`,
        padding: "40px 48px",
        gap: 32,
      },
      [
        h(
          "div",
          // 1000 content - 32 gap - 360 mascot = 608
          { width: 600, display: "flex", flexDirection: "column", gap: 20 },
          [
            h(
              "div",
              {
                display: "flex",
                alignSelf: "flex-start",
                fontSize: 30,
                color: "#1679B0",
                background: "#C9E8FA",
                padding: "6px 20px",
                borderRadius: 999,
              },
              eyebrow,
            ),
            h(
              "div",
              {
                fontFamily: "DynaPuff",
                fontSize: title.length > 30 ? 64 : 84,
                lineHeight: 1.1,
              },
              title,
            ),
            h(
              "div",
              { display: "flex", alignItems: "center", gap: 18, marginTop: 12 },
              [
                h(
                  "div",
                  { display: "flex", fontFamily: "DynaPuff", fontSize: 44 },
                  [
                    h("span", {}, "HAE"),
                    h("span", { color: "#1679B0" }, "JOY"),
                  ],
                ),
                h(
                  "div",
                  {
                    display: "flex",
                    fontSize: 28,
                    background: "#FFC83A",
                    border: `4px solid ${ink}`,
                    borderRadius: 999,
                    padding: "4px 20px",
                  },
                  "youtube.com/@haejoy",
                ),
              ],
            ),
          ],
        ),
        h("img", { width: 360, height: 405 }, undefined, {
          src: mascot,
          width: 360,
          height: 405,
        }),
      ],
    ),
  );

  const svg = await satori(tree as never, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "DynaPuff", data: dyna, weight: 700, style: "normal" },
      { name: "Nunito", data: nunito, weight: 800, style: "normal" },
    ],
  });
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
