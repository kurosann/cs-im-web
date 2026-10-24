import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1", "192.168.3.2", "192.168.3.*"],
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
			source: "/auth/v1/:path*",
			destination: `${apiBase}/auth/v1/:path*`,
		},
    {
      source: "/admin/v1/:path*",
      destination: `${apiBase}/admin/v1/:path*`,
    },
  ];
}

nextConfig.rewrites = rewrites;

export default nextConfig;
