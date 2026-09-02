import fs from "node:fs";

const directory = fs.readFileSync("app/interview-experiences/page.tsx", "utf8");
const publicDirectory = fs.readFileSync("features/interview-experiences/experience-directory.tsx", "utf8");
const company = fs.readFileSync("app/interview-experiences/[company]/page.tsx", "utf8");
const publicReports = fs.readFileSync("lib/supabase/public.ts", "utf8");
const combined = `${directory}\n${company}`;
const failures = [];
for (const prohibited of ["Demo entry", "Sample Company", "demo entries", "filter-count", "fake candidate", "resource-card"]) if (combined.toLowerCase().includes(prohibited.toLowerCase())) failures.push(`Public experience UI contains fabricated-directory marker: ${prohibited}.`);
if (!publicDirectory.includes("No reviewed public interview experiences are published yet.")) failures.push("Main directory lacks the required honest empty state.");
if (!company.includes("ExperienceDirectory") || !company.includes("companyName: item.name")) failures.push("Company workspace does not reuse the honest company-scoped reviewed directory.");
if (!publicDirectory.includes("experiences.length") || !publicReports.includes('eq("status", "approved")') || !publicReports.includes('eq("publication_consent", true)')) failures.push("Main directory does not expose a real approved-record-only architecture.");
if (!publicDirectory.includes("temporarily unavailable") || !publicDirectory.includes("cannot make a completeness claim")) failures.push("Public query failures or unconfigured environments can still masquerade as a true empty state.");
if (!company.includes("No fabricated")) failures.push("Company workspace does not explicitly reject fabricated entries and counts.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Experience integrity regression passed: no demo cards, fake candidates, or fake counts; honest empty states are present.");
