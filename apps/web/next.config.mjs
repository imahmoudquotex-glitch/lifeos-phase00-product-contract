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

  // Phase 04: native crypto packages used in vault-crypto/security — exclude from bundling
  experimental: {
    serverComponentsExternalPackages: ['@noble/ciphers', '@noble/hashes'],
  },
};

export default nextConfig;
