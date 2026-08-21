import fs from "node:fs";

const directory = fs.readFileSync("app/interview-experiences/page.tsx", "utf8");
const publicDirectory = fs.readFileSync("features/interview-experiences/experience-directory.tsx", "utf8");
const company = fs.readFileSync("app/interview-experiences/[company]/page.tsx", "utf8");
const combined = `${directory}\n${company}`;
const failures = [];
for (const prohibited of ["Demo entry", "Sample Company", "demo entries", "filter-count", "fake candidate", "resource-card"]) if (combined.toLowerCase().includes(prohibited.toLowerCase())) failures.push(`Public experience UI contains fabricated-directory marker: ${prohibited}.`);
if (!publicDirectory.includes("No reviewed public interview experiences are published yet.")) failures.push("Main directory lacks the required honest empty state.");
if (!company.includes("No reviewed public interview experiences are published yet.")) failures.push("Company workspace lacks the required honest empty state.");
if (!publicDirectory.includes("experiences.length") || !directory.includes("status\", \"approved\"")) failures.push("Main directory does not expose a real approved-record-only architecture.");
if (!company.includes("No fabricated")) failures.push("Company workspace does not explicitly reject fabricated entries and counts.");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}
console.log("Experience integrity regression passed: no demo cards, fake candidates, or fake counts; honest empty states are present.");
