import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    additionalManifestEntries: [
      { url: "/uploads/e2b78fb471885c69.png", revision: null },
    ],
    runtimeCaching: [
      // Cache all Next.js JS/CSS bundles (long-lived, content-hashed)
      {
        urlPattern: /^\/_next\/static\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-static",
          expiration: { maxEntries: 500, maxAgeSeconds: 365 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Cache Next.js optimized images
      {
        urlPattern: /^\/_next\/image\?.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "next-image",
          expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Cache API data responses (categories, etc.)
      {
        urlPattern: /\/api\/(?!admin).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-data",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Cache all public pages — try network first, fall back to cached version
      {
        urlPattern: /^\/(?!(api|admin|_next)\/).*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages",
          networkTimeoutSeconds: 5,
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Cache external species images
      {
        urlPattern: /^https:\/\/picsum\.photos\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "species-images",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "species-images",
          expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
})(nextConfig);
