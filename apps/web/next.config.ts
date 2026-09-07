import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const monorepoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

const nextConfig: NextConfig = {
  // Externalize packages that crash Turbopack (DOMMatrix, canvas etc.)
  serverExternalPackages: ['pdf-parse', 'officeparser'],

  // Transpile shared monorepo packages
  transpilePackages: ['@learnaxia/shared'],

  // Image optimization + L1: remotePatterns
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      // Kullanıcı profil fotoğrafları için genel HTTPS — avatar URL'leri DB'den geliyor.
      // Wildcard yerine spesifik domain eklemek daha güvenli olduğundan
      // ileride kullanıcılar kendi CDN URL'lerini profile photo olarak eklemeye başlarsa
      // buraya eklenmeli. Şu an sadece bilinen provider'lar destekleniyor.
      { protocol: 'https', hostname: 'imagedelivery.net' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  // Compression
  compress: true,

  // Power bundle optimization
  experimental: {
    scrollRestoration: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  output: 'standalone',
  outputFileTracingRoot: monorepoRoot,

  // Security & Performance headers
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval Next.js için gerekli
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache fonts
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for trailing slashes
  trailingSlash: false,

  // Production source maps off for smaller bundles
  productionBrowserSourceMaps: false,
};

export default nextConfig;
