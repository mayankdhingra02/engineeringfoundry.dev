import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./lib/security/headers";
import { mlDesignLegacyProblemSlugs } from "./lib/ml-design-routes";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  async redirects() {
    return [
      {
        source: "/system-design",
        destination: "/system-design/start-here/introduction",
        permanent: true,
      },
      {
        source: "/system-design/introduction",
        destination: "/system-design/start-here/introduction",
        permanent: true,
      },
      ...Object.entries({
        "url-shortener": "url-shortener",
        "notification-service": "notification-service",
        "chat-system": "chat-system",
        "rate-limiter": "rate-limiter",
        "news-feed": "news-feed",
        "cloud-file-storage": "cloud-file-storage",
        "search-autocomplete": "search-autocomplete",
        "web-crawler": "web-crawler",
        "metrics-platform": "metrics-platform",
        "ticket-reservation": "ticketmaster",
      }).map(([source, destination]) => ({
        source: `/system-design/${source}`,
        destination: `/system-design/problems/${destination}`,
        permanent: true,
      })),
      ...Object.entries(mlDesignLegacyProblemSlugs).map(([source, destination]) => ({
        source: `/ml-design/${source}`,
        destination: `/ml-design/problems/${destination}`,
        permanent: true,
      })),
      ...[
        "/system-design/start-here/scalability-fundamentals",
        "/system-design/start-here/availability-and-reliability-fundamentals",
        "/system-design/start-here/latency-throughput-availability",
      ].map((source) => ({
        source,
        destination: "/system-design/start-here/core-system-properties",
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        // Defined in lib/security/headers.ts so the policy has one definition
        // shared with its regression test.
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
