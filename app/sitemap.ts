import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { companies } from "@/data/companies";
import { dsaTopics } from "@/data/dsa";
import { activeMlDesignProblems } from "@/data/ml-design";
import { activeChallenges } from "@/data/challenges";
import { systemDesignLessons } from "@/data/system-design/curriculum";
import { lowLevelDesignLessons, lowLevelDesignPractice } from "@/data/low-level-design";
import { salaryNegotiationModules } from "@/data/salary-negotiation";
import { dsaCurriculumPages } from "@/data/dsa/curriculum";
import { V1_ROUND_EXECUTION_GUIDES, roundExecutionGuideHref } from "@/lib/interview-playbook/round-execution-presentation";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/prepare", "/dsa", "/system-design/start-here/introduction", "/system-design/problems", "/system-design/plan", "/low-level-design", "/low-level-design/practice", "/salary-negotiation", "/ml-design", "/behavioral", "/interview-tips", "/interview-tips/rounds", "/companies", "/resources", "/mock-interviews", "/referrals", "/interview-experiences", "/challenges", "/leaderboard", "/community", "/about", "/faq", "/contact", "/privacy", "/terms"];
  const dynamic = [...companies.map((c) => `/companies/${c.slug}`), ...companies.map((c) => `/interview-experiences/${c.slug}`), ...dsaTopics.map((topic) => `/dsa/${topic.slug}`), ...dsaCurriculumPages.map((page) => page.slug!), "/dsa/questions", "/dsa/roadmap", "/dsa/patterns", ...systemDesignLessons.filter((lesson) => lesson.status === "published").map((lesson) => lesson.slug!), ...lowLevelDesignLessons.filter((lesson) => lesson.status === "published").map((lesson) => `/low-level-design/lessons/${lesson.slug}`), ...lowLevelDesignPractice.filter((problem) => problem.status === "published").map((problem) => `/low-level-design/practice/${problem.slug}`), ...salaryNegotiationModules.filter((module) => module.status === "published").map((module) => `/salary-negotiation/${module.slug}`), ...activeMlDesignProblems.map((problem) => `/ml-design/${problem.slug}`), ...activeChallenges.map((challenge) => `/challenges/${challenge.slug}`), ...V1_ROUND_EXECUTION_GUIDES.map((guide) => roundExecutionGuideHref(guide.slug))];
  return [...new Set([...routes, ...dynamic])].map((route) => ({ url: `${siteConfig.url}${route}`, changeFrequency: route === "" ? "weekly" : "monthly", priority: route === "" ? 1 : .7 }));
}
