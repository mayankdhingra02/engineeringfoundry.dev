import {
  systemDesignPracticeProblemManifest,
  systemDesignTopicManifest,
} from "../data/system-design/manifest.ts";

const baseUrl = process.env.SYSTEM_DESIGN_AUDIT_BASE_URL ?? "http://localhost:3000";
const canonicalPaths = [
  "/system-design/plan",
  "/system-design/practice",
  "/system-design/problems",
  ...systemDesignTopicManifest.map((topic) => topic.slug),
  ...systemDesignPracticeProblemManifest.map((problem) => problem.slug),
];
const redirects = new Map([
  ["/system-design", "/system-design/start-here/introduction"],
  ["/system-design/introduction", "/system-design/start-here/introduction"],
  ["/system-design/url-shortener", "/system-design/problems/url-shortener"],
  ["/system-design/notification-service", "/system-design/problems/notification-service"],
  ["/system-design/chat-system", "/system-design/problems/chat-system"],
  ["/system-design/rate-limiter", "/system-design/problems/rate-limiter"],
  ["/system-design/news-feed", "/system-design/problems/news-feed"],
  ["/system-design/cloud-file-storage", "/system-design/problems/cloud-file-storage"],
  ["/system-design/search-autocomplete", "/system-design/problems/search-autocomplete"],
  ["/system-design/web-crawler", "/system-design/problems/web-crawler"],
  ["/system-design/metrics-platform", "/system-design/problems/metrics-platform"],
  ["/system-design/ticket-reservation", "/system-design/problems/ticketmaster"],
]);

const failures = [];
let cursor = 0;

async function worker() {
  while (cursor < canonicalPaths.length) {
    const path = canonicalPaths[cursor++];
    try {
      const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" });
      if (response.status !== 200) failures.push(`${response.status} ${path}`);
      await response.body?.cancel();
    } catch (error) {
      failures.push(`network error ${path}: ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: 8 }, worker));
for (const [source, destination] of redirects) {
  const response = await fetch(`${baseUrl}${source}`, { redirect: "manual" });
  if (response.status !== 308 || response.headers.get("location") !== destination) {
    failures.push(`${source} expected 308 → ${destination}, received ${response.status} → ${response.headers.get("location")}`);
  }
  await response.body?.cancel();
}

if (failures.length) {
  console.error(`System Design route audit failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`System Design route audit passed: ${canonicalPaths.length} canonical routes returned 200 and ${redirects.size} retired routes returned exact 308 redirects.`);
}
