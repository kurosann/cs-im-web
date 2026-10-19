import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

async function rewrites() {
  const apiBase = process.env.CS_IM_API_BASE ?? "http://127.0.0.1:8080";
  return [
    {
      source: "/api/v1/:path*",
      destination: `${apiBase}/api/v1/:path*`,
    },
  ];
}

nextConfig.rewrites = rewrites;

export default nextConfig;
