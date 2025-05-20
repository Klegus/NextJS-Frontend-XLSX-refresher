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
  
  // Uproszczona konfiguracja dla poprawnej obsługi przekierowań
  poweredByHeader: false,
  
  // Wyłączamy assetPrefix, który może powodować problemy z przekierowaniami
  
  // Bardziej stabilne ustawienia dla środowisk
  env: {
    NEXTAUTH_URL: process.env.NODE_ENV === 'production' ? 'https://dev.planinf.pl' : 'http://localhost:5000',
    SITE_URL: process.env.NODE_ENV === 'production' ? 'https://dev.planinf.pl' : 'http://localhost:5000'
  },
  
  // Przestajemy walczyć z nagłówkami - zostawić to dla Nginx
  
  // Uproszczona konfiguracja runtime
  publicRuntimeConfig: {
    host: process.env.NODE_ENV === 'production' ? 'https://dev.planinf.pl' : 'http://localhost:5000',
  },
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