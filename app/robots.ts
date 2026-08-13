import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: "*", allow: "/", disallow: ["/auth/", "/dashboard", "/forgot-password", "/onboarding", "/reset-password", "/settings/", "/sign-in", "/sign-up"] }, sitemap: `${siteConfig.url}/sitemap.xml`, host: siteConfig.url }; }
