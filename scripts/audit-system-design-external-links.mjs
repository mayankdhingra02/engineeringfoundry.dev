import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => sourceFiles(`${directory}/${entry.name}`)));
  return [
    ...entries.filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name)).map((entry) => `${directory}/${entry.name}`),
    ...nested.flat(),
  ];
}

async function requestStatus(url, method) {
  try {
    const { stdout } = await run("curl", ["-L", "-sS", method === "HEAD" ? "-I" : "-X", method === "HEAD" ? "" : "GET", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "20", url].filter(Boolean), { maxBuffer: 1024 * 1024 });
    return Number(stdout.slice(-3)) || 0;
  } catch (error) {
    return Number(error.stdout?.slice(-3)) || 0;
  }
}

async function check(url) {
  let status = await requestStatus(url, "HEAD");
  if (!status || status === 405 || status >= 500) status = await requestStatus(url, "GET");
  return { url, status };
}

const files = await sourceFiles("content/system-design");
const sources = await Promise.all(files.map((file) => readFile(file, "utf8")));
const urls = [...new Set(sources.flatMap((source) => [...source.matchAll(/url:\s*"(https:\/\/[^"\s]+)"/g)].map((match) => match[1])))].sort();
const results = [];
let cursor = 0;

async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++];
    results.push(await check(url));
  }
}

await Promise.all(Array.from({ length: 8 }, worker));
results.sort((a, b) => a.url.localeCompare(b.url));
const hardFailures = results.filter(({ status }) => status === 0 || status === 404 || status >= 500);
const guarded = results.filter(({ status }) => [401, 403, 429].includes(status));

if (hardFailures.length) {
  console.error(`System Design external-link audit failed: ${hardFailures.length}/${results.length} hard failures.`);
  for (const item of hardFailures) console.error(`- ${item.status || "network error"} ${item.url}`);
  process.exitCode = 1;
} else {
  console.log(`System Design external-link audit passed: ${results.length - guarded.length} open links and ${guarded.length} reachable guarded links; no hard failures across ${results.length} authoritative URLs.`);
}
