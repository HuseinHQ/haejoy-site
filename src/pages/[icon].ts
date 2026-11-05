// Raster icons rendered from public/favicon.svg at build time, so there is one source of truth.
import type { APIRoute, GetStaticPaths } from "astro";
import { readFile } from "node:fs/promises";
import sharp from "sharp";

const sizes: Record<string, number> = {
  "favicon.ico": 32,
  "apple-touch-icon.png": 180,
  "icon-192.png": 192,
  "icon-512.png": 512,
};

export const getStaticPaths = (() =>
  Object.keys(sizes).map((icon) => ({
    params: { icon },
  }))) satisfies GetStaticPaths;

// Wrap one PNG in an ICO container (PNG-in-ICO is supported by every current browser).
function ico(png: Buffer, size: number) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(1, 2); // type: icon
  head.writeUInt16LE(1, 4); // one image
  head.writeUInt8(size, 6);
  head.writeUInt8(size, 7);
  head.writeUInt16LE(1, 10); // planes
  head.writeUInt16LE(32, 12); // bits per pixel
  head.writeUInt32LE(png.length, 14);
  head.writeUInt32LE(22, 18); // data offset
  return Buffer.concat([head, png]);
}

export const GET: APIRoute = async ({ params }) => {
  const name = params.icon!;
  const size = sizes[name]!;
  const svg = await readFile("public/favicon.svg");
  let img = sharp(svg, { density: (72 * size) / 64 }).resize(size, size);
  // Home-screen icons need an opaque background (iOS turns transparency black).
  if (name !== "favicon.ico") img = img.flatten({ background: "#C9E8FA" });
  const png = await img.png().toBuffer();
  const body = name === "favicon.ico" ? ico(png, size) : png;
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": name === "favicon.ico" ? "image/x-icon" : "image/png",
    },
  });
};
