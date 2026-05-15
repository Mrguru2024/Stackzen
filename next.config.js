const path = require('path');

/** @type {import('next').NextConfig} */
const _nextConfig = {
  // Keep Upstash on the server — avoids client bundles resolving nodejs.mjs
  serverExternalPackages: ['@upstash/redis'],

  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Enable server components by default
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  compiler: {
    styledComponents: false,
    removeConsole: process.env.NODE_ENV === 'production',
    emotion: false,
  },

  // Optimize webpack configuration
  webpack: (config, { isServer, dev }) => {
    const prismaGenerated = path.join(__dirname, 'prisma', '.generated', 'current');
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prefer generated client path (see prisma/schema.prisma generator output); avoids relying on junction alone.
      '@prisma/client': prismaGenerated,
    };
    // Remove any Babel loaders
    config.module.rules = config.module.rules.filter(rule => {
      if (!rule.use) return true;
      if (Array.isArray(rule.use)) {
        return !rule.use.some(use => use?.loader?.includes('babel-loader'));
      }
      return !rule.use.loader?.includes('babel-loader');
    });

    // Optimize bundle splitting
    // if (!isServer && !dev) {
    //   config.optimization.splitChunks = {
    //     chunks: 'all',
    //     cacheGroups: {
    //       vendor: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name: 'vendors',
    //         chunks: 'all',
    //       },
    //       common: {
    //         name: 'common',
    //         minChunks: 2,
    //         chunks: 'all',
    //         enforce: true,
    //       },
    //     },
    //   };
    // }

    // RSC flight loader expects these bare specifiers; some installs fail to apply Next's
    // internal aliases (e.g. broken node_modules). Point client bundles at compiled shims.
    if (!isServer) {
      const rsdw = path.join(
        __dirname,
        'node_modules',
        'next',
        'dist',
        'compiled',
        'react-server-dom-webpack'
      );
      config.resolve.alias = {
        ...config.resolve.alias,
        'react-server-dom-webpack/server': path.join(rsdw, 'server.browser.js'),
        'react-server-dom-webpack/client': path.join(rsdw, 'client.browser.js'),
      };
    }

    return config;
  },

  turbopack: {},

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      },
      {
        protocol: 'https',
        hostname: 'cdn.stackzen.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Enable compression
  compress: true,

  // Configure headers for security and performance
  async headers() {
    return [
      // Never long-cache API routes — breaks NextAuth JSON (session/csrf) if a bad response is cached
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Temporarily disable CSP for development
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: wss: data: blob:;",
          },
          {
            key: 'Document-Policy',
            value: 'js-profiling',
          },
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=()',
          },
        ],
      },
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              source: '/_next/static/:path*',
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000, immutable',
                },
              ],
            },
          ]
        : []),
    ];
  },

  // Configure redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },

  // Asset Prefix for CDN (only enable if NEXT_PUBLIC_USE_CDN is 'true' and in production)
  assetPrefix:
    process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_USE_CDN === 'true'
      ? 'https://cdn.stackzen.com'
      : undefined,
};

const _withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// To use the CDN for static assets, set NEXT_PUBLIC_USE_CDN='true' in your environment. Otherwise, assets will load from the default domain. This prevents ERR_NAME_NOT_RESOLVED in local/dev.

module.exports = _withBundleAnalyzer(_nextConfig);
