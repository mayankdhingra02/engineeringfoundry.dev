import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { companies } from "@/data/companies";
import { dsaTopics } from "@/data/dsa";
import { activeMlDesignProblems } from "@/data/ml-design";
import { activeSystemDesignProblems } from "@/data/system-design";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/dsa", "/system-design", "/ml-design", "/behavioral", "/interview-tips", "/companies", "/resources", "/mock-interviews", "/referrals", "/interview-experiences", "/challenges", "/leaderboard", "/community", "/about", "/faq", "/contact", "/privacy", "/terms"];
  const dynamic = [...companies.map((c) => `/companies/${c.slug}`), ...companies.map((c) => `/interview-experiences/${c.slug}`), ...dsaTopics.map((topic) => `/dsa/${topic.slug}`), ...activeSystemDesignProblems.map((problem) => `/system-design/${problem.slug}`), ...activeMlDesignProblems.map((problem) => `/ml-design/${problem.slug}`)];
  return [...routes, ...dynamic].map((route) => ({ url: `${siteConfig.url}${route}`, changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : .7 }));
}
