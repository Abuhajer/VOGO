const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const SHARP_TRACE_EXCLUDES = [
  "node_modules/@img/sharp-win32-x64/**",
  "node_modules/@img/sharp-win32-arm64/**",
  "node_modules/@img/sharp-wasm32/**",
  "node_modules/@img/sharp-darwin-x64/**",
  "node_modules/@img/sharp-darwin-arm64/**",
  "node_modules/@img/sharp-linux-arm64/**",
  "node_modules/@img/sharp-linux-arm/**",
  "node_modules/@img/sharp-linux-s390x/**",
  "node_modules/@img/sharp-linux-ppc64/**",
  "node_modules/@img/sharp-linux-riscv64/**",
  "node_modules/@img/sharp-libvips-dev/**",
  "node_modules/@img/sharp-libvips-dev-*/**",
];

const NETLIFY_TRACE_EXCLUDES = [
  ...SHARP_TRACE_EXCLUDES,
  "public/**",
  ".next/cache/**",
  "node_modules/typescript/**",
  "node_modules/eslint/**",
  "node_modules/@types/**",
  "node_modules/prisma/**",
  "node_modules/.cache/**",
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ["sharp", "@prisma/client"],
    ...(process.env.NETLIFY === "true"
      ? {
          outputFileTracingExcludes: {
            "*": NETLIFY_TRACE_EXCLUDES,
          },
        }
      : {}),
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },

  images: {
    // Netlify deploy ships `public/` to CDN only (excluded from function bundle to stay under 250MB).
    // `/_next/image` cannot read those files in the serverless handler → 400 on all local assets.
    unoptimized: process.env.NETLIFY === "true",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
