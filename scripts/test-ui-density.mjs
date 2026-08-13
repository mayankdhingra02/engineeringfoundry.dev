import { readFileSync } from "node:fs";

const css = readFileSync("app/globals.css", "utf8");
const guide = readFileSync("docs/ui-density.md", "utf8");
const failures = [];

function requireMatch(pattern, message) {
  if (!pattern.test(css)) failures.push(message);
}

function numericValue(selector, property) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = [...css.matchAll(new RegExp(`${escapedSelector}\\s*\\{[^}]*${property}:\\s*(\\d+)px`, "g"))];
  return matches.length ? Number(matches.at(-1)[1]) : null;
}

requireMatch(/--section-space:\s*clamp\(56px,\s*5vw,\s*68px\)/, "The global section-space token is missing or unexpectedly expanded.");
requireMatch(/--section-space-compact:\s*clamp\(42px,\s*3\.5vw,\s*48px\)/, "The compact section-space token is missing or unexpectedly expanded.");
requireMatch(/--card-padding:\s*clamp\(18px,\s*2vw,\s*21px\)/, "The shared card-padding token is missing or unexpectedly expanded.");
requireMatch(/\.section\s*\{\s*padding-block:\s*var\(--section-space\)/, "Standard sections must use the shared density token.");

const heroHeight = numericValue(".hero-inner", "min-height");
if (heroHeight === null || heroHeight > 600) failures.push(`Homepage hero min-height must stay at or below 600px; received ${heroHeight ?? "no value"}.`);

const featureHeight = numericValue(".feature-card", "min-height");
if (featureHeight === null || featureHeight > 250) failures.push(`Generic feature-card min-height must stay at or below 250px; received ${featureHeight ?? "no value"}.`);

const buttonHeight = numericValue(".button", "min-height");
if (buttonHeight === null || buttonHeight < 36) failures.push(`Standard buttons must remain at least 36px high; received ${buttonHeight ?? "no value"}.`);

if (!guide.includes("Density comes from removing artificial whitespace")) failures.push("The UI density guide no longer states the core typography and whitespace principle.");
if (!guide.includes("Form inputs and selects remain approximately 40–44px high")) failures.push("The UI density guide no longer records form-control accessibility minimums.");

if (failures.length) {
  console.error(`UI density regression failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`UI density regression passed: hero ${heroHeight}px, generic cards ${featureHeight}px, standard buttons ${buttonHeight}px, and shared spacing tokens are within guardrails.`);
