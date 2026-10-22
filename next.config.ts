import type { NextConfig } from "next";

// Where case studies and audiences come from (docs/content-source.md). `canvas` reads
// the snapshot written by scripts/sync-content.mjs, which runs before dev and build.
const contentSource =
  process.env.PORTFOLIO_CONTENT_SOURCE === "canvas"
    ? "./content/generated/portfolio.json"
    : "./content/local.ts";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: {
      "@content-source": contentSource,
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
