import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { companies } from "@/data/companies";
import { dsaTopics } from "@/data/dsa";
import { systemDesignProblems } from "@/data/fixtures/system-design";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/dsa", "/system-design", "/ml-design", "/behavioral", "/interview-tips", "/companies", "/resources", "/mock-interviews", "/referrals", "/interview-experiences", "/challenges", "/leaderboard", "/community", "/about", "/faq", "/contact", "/privacy", "/terms"];
  const dynamic = [...companies.map((c) => `/companies/${c.slug}`), ...companies.map((c) => `/interview-experiences/${c.slug}`), ...dsaTopics.map((topic) => `/dsa/${topic.slug}`), ...systemDesignProblems.map((problem) => `/system-design/${problem.slug}`)];
  return [...routes, ...dynamic].map((route) => ({ url: `${siteConfig.url}${route}`, lastModified: new Date(), changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : .7 }));
}
