import fs from "node:fs";

const directory = fs.readFileSync("app/interview-experiences/page.tsx", "utf8");
const publicDirectory = fs.readFileSync("features/interview-experiences/experience-directory.tsx", "utf8");
const company = fs.readFileSync("app/interview-experiences/[company]/page.tsx", "utf8");
const publicClient = fs.readFileSync("lib/supabase/public.ts", "utf8");
const combined = `${directory}\n${company}`;
const failures = [];
for (const prohibited of ["Demo entry", "Sample Company", "demo entries", "filter-count", "fake candidate", "resource-card"]) if (combined.toLowerCase().includes(prohibited.toLowerCase())) failures.push(`Public experience UI contains fabricated-directory marker: ${prohibited}.`);
if (!publicDirectory.includes("No reviewed public interview experiences are published yet.")) failures.push("Main directory lacks the required honest empty state.");
if (!company.includes("ExperienceDirectory") || !company.includes("experiences={experiences}")) failures.push("Company workspace does not render the shared honest directory empty state.");
if (!publicDirectory.includes("experiences.length") || !directory.includes("status\", \"approved\"")) failures.push("Main directory does not expose a real approved-record-only architecture.");
if (!company.includes("No fabricated")) failures.push("Company workspace does not explicitly reject fabricated entries and counts.");
if (!publicClient.includes("isSupabaseConfigured") || publicClient.includes("isAccountPlatformAvailable") || publicClient.includes('from "next/headers"')) failures.push("Public experience reads are not isolated from account cookies or account-platform availability.");
if (!publicDirectory.includes("This selected-company view does not substitute unrelated reports.")) failures.push("Selected-company zero states can fall back to unrelated reports.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Experience integrity regression passed: no demo cards, fake candidates, or fake counts; honest empty states are present.");
