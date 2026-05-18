const fs = require('fs');
const path = require('path');

/**
 * PostCSS requires `nanoid/non-secure`. Under pnpm, `nanoid` often lives only in
 * `.pnpm/nanoid@…/node_modules`, not next to `postcss`, so Turbopack/webpack can fail
 * to resolve it when processing CSS. Point the bare specifier at the real file.
 */
function resolveNanoidNonSecureSync() {
  const nm = path.join(__dirname, 'node_modules');
  try {
    return require.resolve('nanoid/non-secure', { paths: [nm] });
  } catch {
    const pnpmDir = path.join(nm, '.pnpm');
    if (!fs.existsSync(pnpmDir)) {
      return undefined;
    }
    const dirs = fs.readdirSync(pnpmDir);
    for (let i = 0; i < dirs.length; i++) {
      const name = dirs[i];
      if (!name.startsWith('nanoid@')) continue;
      const candidate = path.join(
        pnpmDir,
        name,
        'node_modules',
        'nanoid',
        'non-secure',
        'index.cjs'
      );
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }
  return undefined;
}

const NANOID_NON_SECURE = resolveNanoidNonSecureSync();
const { getGlobalSecurityHeaders } = require('./lib/security/security-headers.js');

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
      ...(NANOID_NON_SECURE ? { 'nanoid/non-secure': NANOID_NON_SECURE } : {}),
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

  // Turbopack can mis-infer the workspace root (e.g. treating `app/` as root on Windows);
  // `next` must resolve from the directory that contains package.json + node_modules.
  turbopack: {
    root: path.resolve(__dirname),
    ...(NANOID_NON_SECURE
      ? {
          resolveAlias: {
            'nanoid/non-secure': NANOID_NON_SECURE,
          },
        }
      : {}),
  },

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
        headers: getGlobalSecurityHeaders(process.env.NODE_ENV === 'production'),
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

const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = _withBundleAnalyzer(_nextConfig);

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: Boolean(process.env.SENTRY_AUTH_TOKEN),
});
