import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { PRIVATE_ROBOTS_DISALLOW } from "@/lib/privacy/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Derived from the canonical private-route classification so a new
      // authenticated surface is excluded here and from analytics together.
      disallow: [...PRIVATE_ROBOTS_DISALLOW],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
