// @ts-check
import { defineConfig, envField } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { fonts } from "./src/fonts";

const font = envField.enum({
  context: "server",
  access: "public",
  values: /** @type {[string, ...string[]]} */ (Object.keys(fonts)),
  default: "nunito",
});

// https://astro.build/config
export default defineConfig({
  site: "https://haejoy.my.id",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  image: { domains: ["i.ytimg.com"] },
  integrations: [sitemap()],
  env: { schema: { FONT_DISPLAY: font, FONT_BODY: font } },
});
