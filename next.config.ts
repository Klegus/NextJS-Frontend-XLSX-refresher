import type { NextConfig } from "next";
import JavaScriptObfuscator from 'webpack-obfuscator';

const isProd = process.env.NODE_ENV === 'production';

// Content-Security-Policy: scripts and connections only to this origin; images
// may come from HTTPS (Moodle announcement images, logo). 'unsafe-inline' is
// needed for Next.js inline bootstrap scripts; 'unsafe-eval' only in `next dev`.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  reactStrictMode: true,
  // Self-contained server bundle: the Docker image ships only what runs in production
  output: 'standalone',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // Uproszczona konfiguracja dla poprawnej obsługi przekierowań
  poweredByHeader: false,
  
  // Wyłączamy assetPrefix, który może powodować problemy z przekierowaniami
  
  webpack: (config, { dev, isServer }) => {
    // Aplikujemy obfuscator tylko dla produkcji i kodu klienta
    if (!dev && !isServer) {
      config.plugins.push(
        new JavaScriptObfuscator({
          compact: true,
          identifierNamesGenerator: 'hexadecimal',
          rotateStringArray: true,
          stringArray: true,
          stringArrayEncoding: ['none'], // Zmienione z 'base64' dla lepszej wydajności
          stringArrayThreshold: 0.5, // Zmniejszone dla lepszej wydajności
          transformObjectKeys: false, // Wyłączone dla lepszej wydajności
          disableConsoleOutput: true
        })
      );
    }
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 25,
          minSize: 20000
        }
      };
    }
    return config;
  },
  // Wyłączamy source maps w produkcji
  productionBrowserSourceMaps: false,
  compress: true,
  generateEtags: true,
};

export default nextConfig;