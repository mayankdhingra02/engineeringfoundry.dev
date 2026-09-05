import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { indexableFinitePublicRoutes } from "@/lib/public-route-inventory";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/prepare", "/dsa", "/system-design/start-here/introduction", "/system-design/problems", "/system-design/plan", "/low-level-design", "/low-level-design/practice", "/low-level-design/rubric", "/salary-negotiation", "/ml-design", "/behavioral", "/behavioral/learn", "/behavioral/practice", "/behavioral/review", "/interview-tips", "/interview-tips/rounds", "/interview-tips/methodology", "/companies", "/resources", "/mock-interviews", "/referrals", "/interview-experiences", "/challenges", "/leaderboard", "/community", "/about", "/faq", "/contact", "/feedback", "/privacy", "/terms"];
  return [...new Set([...routes, ...indexableFinitePublicRoutes])].map((route) => ({ url: `${siteConfig.url}${route}`, changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : .7 }));
}
