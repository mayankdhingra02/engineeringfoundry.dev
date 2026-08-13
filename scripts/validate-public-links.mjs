import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const failures = [];

async function walk(directory, extensions) {
  const entries = await readdir(path.join(root, directory), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(relative, extensions)));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) files.push(relative);
  }
  return files;
}

const pageFiles = await walk("app", ["page.tsx"]);
const routePatterns = pageFiles.map((file) => {
  const route = file
    .replace(/^app/, "")
    .replace(/\/page\.tsx$/, "")
    .replace(/\[\.\.\.([^\]]+)\]/g, "__CATCH_ALL__")
    .replace(/\[([^\]]+)\]/g, "__DYNAMIC__") || "/";
  const escaped = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replaceAll("__CATCH_ALL__", ".+")
    .replaceAll("__DYNAMIC__", "[^/]+");
  return new RegExp(`^${escaped}/?$`);
});

const sourceFiles = [
  ...(await walk("app", [".ts", ".tsx"])),
  ...(await walk("components", [".ts", ".tsx"])),
  ...(await walk("config", [".ts", ".tsx"])),
  ...(await walk("data", [".ts", ".tsx", ".json"])),
];

const internalLinks = new Map();
for (const file of sourceFiles) {
  const source = await readFile(path.join(root, file), "utf8");
  const patterns = [
    /\b(?:href|url)\s*=\s*["'](\/[^"']*)["']/g,
    /\b(?:href|url)\s*=\s*\{\s*["'](\/[^"']*)["']\s*\}/g,
    /\b(?:href|url)\s*:\s*["'](\/[^"']*)["']/g,
  ];
  if (file === "app/sitemap.ts") patterns.push(/["'](\/[^"']*)["']/g);
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const link = match[1];
      if (!internalLinks.has(link)) internalLinks.set(link, new Set());
      internalLinks.get(link).add(file);
    }
  }

  for (const tag of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)) {
    const rel = tag[0].match(/rel=["']([^"']+)["']/)?.[1] ?? "";
    if (!rel.split(/\s+/).includes("noopener") || !rel.split(/\s+/).includes("noreferrer")) {
      failures.push(`${file} has a new-tab link without rel="noopener noreferrer".`);
    }
  }
}

for (const [link, files] of internalLinks) {
  const pathname = new URL(link, "https://engineeringfoundry.dev").pathname;
  const publicAsset = existsSync(path.join(root, "public", pathname.replace(/^\//, "")));
  if (!publicAsset && !routePatterns.some((pattern) => pattern.test(pathname))) {
    failures.push(`Unknown internal route ${link} referenced by ${[...files].join(", ")}.`);
  }
}

const resourceSource = await readFile(path.join(root, "data/resources/resources.json"), "utf8");
for (const marker of [/http:\/\//i, /[?&](?:utm_[^=]*|ref|affiliate)=/i]) {
  if (marker.test(resourceSource)) failures.push(`Curated resources matched prohibited external-link pattern ${marker}.`);
}

const siteSource = await readFile(path.join(root, "config/site.ts"), "utf8");
if (!siteSource.includes("https://discord.gg/")) failures.push("Configured Discord fallback must use a real HTTPS discord.gg invite.");

if (failures.length) {
  console.error(`Public link validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`Public link validation passed: ${internalLinks.size} literal internal links resolve to ${pageFiles.length} application page patterns; new-tab and curated external-link rules passed.`);
