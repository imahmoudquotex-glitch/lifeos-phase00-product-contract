/** @type {import('next').NextConfig} */

// Security headers — Phase 04 implementation (ADR 0021)
// CSP nonce is injected per-request in apps/web/middleware.ts
// Headers here are static (nonce excluded from static config intentionally)
const securityHeaders = [
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
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  // Phase 04/05: server-only packages that use node: built-ins — exclude from client bundle
  experimental: {
    serverComponentsExternalPackages: [
      '@noble/ciphers',
      '@noble/hashes',
      'argon2',
      'mjml',
      'pg',
      'pg-promise',
      '@lifeos/db',
      '@lifeos/auth',
      '@lifeos/security',
      '@lifeos/vault-crypto',
      '@lifeos/email',
    ],
  },

  // Webpack: handle node: URI scheme for server components
  webpack(config, { isServer }) {
    if (!isServer) {
      // Client bundle: stub out server-only node built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        fs: false,
        path: false,
        os: false,
        stream: false,
        buffer: false,
      };
    }
    return config;
  },
};

export default nextConfig;
