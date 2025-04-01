import type { NextConfig } from "next";
import JavaScriptObfuscator from 'webpack-obfuscator';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['encrypted-tbn0.gstatic.com'],
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  poweredByHeader: false,
  webpack: (config, { dev, isServer }) => {
    // Aplikujemy obfuscator tylko dla produkcji i kodu klienta
    if (!dev && !isServer) {
      config.plugins.push(
        new JavaScriptObfuscator({
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.4,
          debugProtection: true,
          debugProtectionInterval: 4000,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'mangled',
          numbersToExpressions: true,
          renameGlobals: false,
          renameProperties: false, // Włączenie może powodować błędy w React
          rotateStringArray: true,
          selfDefending: true,
          simplify: true,
          splitStrings: true,
          splitStringsChunkLength: 5,
          stringArray: true,
          stringArrayCallsTransform: true,
          stringArrayCallsTransformThreshold: 0.7,
          stringArrayEncoding: ['rc4'],
          stringArrayIndexShift: true,
          stringArrayRotate: true,
          stringArrayShuffle: true,
          stringArrayWrappersCount: 5,
          stringArrayWrappersChainedCalls: true,
          stringArrayWrappersParametersMaxCount: 5,
          stringArrayWrappersType: 'function',
          stringArrayThreshold: 0.8,
          transformObjectKeys: false,
          unicodeEscapeSequence: false // Unikamy tego dla lepszej wydajności
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
