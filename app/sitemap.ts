import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { companies } from "@/data/fixtures/companies";
import { dsaTopics } from "@/data/fixtures/questions";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/dsa", "/system-design", "/ml-design", "/behavioral", "/interview-tips", "/companies", "/resources", "/mock-interviews", "/referrals", "/interview-experiences", "/challenges", "/leaderboard", "/community", "/about", "/faq", "/contact", "/privacy", "/terms"];
  const dynamic = [...companies.map((c) => `/companies/${c.slug}`), ...companies.map((c) => `/interview-experiences/${c.slug}`), ...dsaTopics.slice(1).map((t) => `/dsa/${t.toLowerCase().replaceAll(" ", "-")}`)];
  return [...routes, ...dynamic].map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date(), changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : .7 }));
}
