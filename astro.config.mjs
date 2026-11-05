// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://haejoy.my.id",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  image: { domains: ["i.ytimg.com"] },
  integrations: [sitemap()],
});
