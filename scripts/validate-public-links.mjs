import { existsSync, statSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sitemap from "../app/sitemap.ts";
import { siteConfig } from "../config/site.ts";
import { globalSearchItems } from "../lib/global-search.ts";
import { finitePublicRouteDefinitions, publicRedirectSourcePaths } from "../lib/public-route-inventory.ts";

const defaultRepositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectories = ["app", "components", "config", "data", "features", "content", "lib"];
const sourceExtensions = [".ts", ".tsx", ".js", ".mjs", ".json"];
const pageSuffix = "/page.tsx";
const routeSuffix = "/route.ts";
const finiteDeclarationPattern = /export\s+const\s+dynamicParams(?:\s*:\s*boolean)?\s*=\s*false\b/;
const dynamicSegmentPattern = /^\[([^.[\]]+)\]$/;
const catchAllSegmentPattern = /^\[\.\.\.([^\]]+)\]$/;
const optionalCatchAllSegmentPattern = /^\[\[\.\.\.([^\]]+)\]\]$/;

async function walkFiles(repositoryRoot, directory, extensions) {
  const absoluteDirectory = path.join(repositoryRoot, directory);
  if (!existsSync(absoluteDirectory)) return [];
  const entries = await readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkFiles(repositoryRoot, relative, extensions)));
    else if (extensions.some((extension) => entry.name.endsWith(extension))) files.push(relative);
  }
  return files;
}

function normalizedFilePath(file) {
  return file.split(path.sep).join("/");
}

export function pagePatternFromFile(file) {
  const normalized = normalizedFilePath(file);
  const suffix = normalized.endsWith(pageSuffix) ? pageSuffix : normalized.endsWith(routeSuffix) ? routeSuffix : null;
  if (!normalized.startsWith("app/") || !suffix) return null;
  const segments = normalized
    .slice("app/".length, -suffix.length)
    .split("/")
    .filter((segment) => segment && !segment.startsWith("(") && !segment.startsWith("@"));
  return segments.length ? `/${segments.join("/")}` : "/";
}

function routeSegments(route) {
  if (route === "/") return [];
  return route.slice(1).split("/");
}

export function matchesPagePattern(pagePattern, pathname) {
  if (typeof pagePattern !== "string" || typeof pathname !== "string") return false;
  if (!pagePattern.startsWith("/") || !pathname.startsWith("/")) return false;
  const patternSegments = routeSegments(pagePattern);
  const pathSegments = routeSegments(pathname);
  if (pathSegments.some((segment) => segment.length === 0)) return false;
  let pathIndex = 0;

  for (let patternIndex = 0; patternIndex < patternSegments.length; patternIndex += 1) {
    const segment = patternSegments[patternIndex];
    if (catchAllSegmentPattern.test(segment)) {
      return patternIndex === patternSegments.length - 1 && pathIndex < pathSegments.length;
    }
    if (optionalCatchAllSegmentPattern.test(segment)) {
      return patternIndex === patternSegments.length - 1;
    }
    if (pathIndex >= pathSegments.length) return false;
    if (!dynamicSegmentPattern.test(segment) && segment !== pathSegments[pathIndex]) return false;
    pathIndex += 1;
  }

  return pathIndex === pathSegments.length;
}

function isDynamicPagePattern(pagePattern) {
  return routeSegments(pagePattern).some((segment) => segment.includes("[") || segment.includes("]"));
}

function containsControlOrBackslash(value) {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127 || character === "\\";
  });
}

function isValidPagePattern(pagePattern) {
  if (typeof pagePattern !== "string" || !pagePattern.startsWith("/") || (pagePattern !== "/" && pagePattern.endsWith("/"))) return false;
  if (pagePattern.includes("//") || pagePattern.includes("?") || pagePattern.includes("#") || containsControlOrBackslash(pagePattern)) return false;
  return routeSegments(pagePattern).every((segment) => {
    if (!segment.includes("[") && !segment.includes("]")) return segment.length > 0;
    return dynamicSegmentPattern.test(segment) || catchAllSegmentPattern.test(segment) || optionalCatchAllSegmentPattern.test(segment);
  });
}

function rawPathFromHref(href) {
  const queryIndex = href.indexOf("?");
  const hashIndex = href.indexOf("#");
  return href.slice(0, [queryIndex, hashIndex].filter((index) => index >= 0).reduce((minimum, index) => Math.min(minimum, index), href.length));
}

function parseRouteHref(value, { allowAbsolute = false, canonicalSiteOrigin } = {}) {
  if (typeof value !== "string" || value.length === 0) return { error: "must be a non-empty string" };
  if (containsControlOrBackslash(value) || /\s/.test(value)) return { error: "contains whitespace, a control character, or a backslash" };

  if (allowAbsolute) {
    if (
      typeof canonicalSiteOrigin !== "string"
      || (value !== canonicalSiteOrigin && !value.startsWith(`${canonicalSiteOrigin}/`))
    ) {
      return { error: `must begin with exact canonical site origin ${canonicalSiteOrigin ?? "(missing)"}` };
    }
    let url;
    try {
      url = new URL(value);
    } catch {
      return { error: "must be an absolute HTTP(S) URL" };
    }
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return { error: "must be an absolute HTTP(S) URL without credentials" };
    if (url.origin !== canonicalSiteOrigin) return { error: `must use canonical site origin ${canonicalSiteOrigin}` };
    if (url.search || url.hash) return { error: "must not contain a query or fragment" };
    const authorityEnd = value.indexOf("/", value.indexOf(":") + 3);
    const rawPath = authorityEnd < 0 ? "/" : rawPathFromHref(value.slice(authorityEnd));
    if (rawPath !== url.pathname) return { error: "contains a non-canonical path" };
    return { pathname: url.pathname };
  }

  if (!value.startsWith("/") || value.startsWith("//")) return { error: "must be a root-relative internal path" };
  const rawPath = rawPathFromHref(value);
  if (rawPath.includes("//")) return { error: "contains an empty path segment" };
  let url;
  try {
    url = new URL(value, "https://engineeringfoundry.dev");
  } catch {
    return { error: "is not a valid root-relative URL" };
  }
  if (rawPath !== url.pathname) return { error: "contains a non-canonical path" };
  return { pathname: url.pathname };
}

function isCanonicalDiscordInvite(value) {
  if (typeof value !== "string" || !value.startsWith("https://") || containsControlOrBackslash(value) || /\s/.test(value)) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === "https:"
    && url.hostname === "discord.gg"
    && !url.username
    && !url.password
    && !url.port
    && /^\/[A-Za-z0-9_-]+$/.test(url.pathname)
    && !url.search
    && !url.hash
    && url.href === value;
}

function validateFiniteDefinitions(definitions, pages, errors) {
  if (!Array.isArray(definitions)) {
    errors.push("finitePublicRouteDefinitions must be an array.");
    return { finiteByPattern: new Map(), finitePaths: new Map() };
  }

  const pagesByPattern = new Map(pages.map((page) => [page.pagePattern, page]));
  const finiteByPattern = new Map();
  const finitePaths = new Map();

  for (const [index, definition] of definitions.entries()) {
    const label = `finitePublicRouteDefinitions[${index}]`;
    if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
      errors.push(`${label} must be an object.`);
      continue;
    }
    if (Object.keys(definition).sort().join(",") !== "pagePattern,paths") errors.push(`${label} must contain only pagePattern and paths.`);
    const { pagePattern, paths } = definition;
    if (!isValidPagePattern(pagePattern) || !isDynamicPagePattern(pagePattern)) {
      errors.push(`${label}.pagePattern must be a canonical dynamic App Router URL pattern.`);
      continue;
    }
    if (finiteByPattern.has(pagePattern)) errors.push(`Duplicate finite route definition for ${pagePattern}.`);
    else finiteByPattern.set(pagePattern, definition);

    const page = pagesByPattern.get(pagePattern);
    if (!page) errors.push(`Finite route definition ${pagePattern} has no matching application page.`);
    else if (!page.dynamicParamsFalse) errors.push(`Finite route definition ${pagePattern} points to a page without dynamicParams = false.`);

    if (!Array.isArray(paths) || paths.length === 0) {
      errors.push(`Finite route definition ${pagePattern} must contain at least one concrete path.`);
      continue;
    }
    const localPaths = new Set();
    for (const [pathIndex, routePath] of paths.entries()) {
      const parsed = parseRouteHref(routePath);
      if (parsed.error || parsed.pathname !== routePath || routePath === "/" || routePath.endsWith("/")) {
        errors.push(`${label}.paths[${pathIndex}] must be a canonical concrete path without query, fragment, or trailing slash.`);
        continue;
      }
      if (routePath.includes("[") || routePath.includes("]") || !matchesPagePattern(pagePattern, routePath)) {
        errors.push(`${label}.paths[${pathIndex}] (${routePath}) does not belong to ${pagePattern}.`);
        continue;
      }
      if (localPaths.has(routePath)) errors.push(`Duplicate finite path ${routePath} in ${pagePattern}.`);
      localPaths.add(routePath);
      const previousPattern = finitePaths.get(routePath);
      if (previousPattern && previousPattern !== pagePattern) errors.push(`Finite path ${routePath} is declared by both ${previousPattern} and ${pagePattern}.`);
      else finitePaths.set(routePath, pagePattern);
    }
  }

  for (const page of pages) {
    if (page.dynamicParamsFalse && !finiteByPattern.has(page.pagePattern)) {
      errors.push(`${page.file} exports dynamicParams = false but ${page.pagePattern} is not registered in finitePublicRouteDefinitions.`);
    }
  }

  return { finiteByPattern, finitePaths };
}

function extractLiteralInternalLinks(source, file) {
  const links = [];
  const patterns = [
    /\b(?:href|url)\s*=\s*["'](\/[^"']*)["']/g,
    /\b(?:href|url)\s*=\s*\{\s*["'](\/[^"']*)["']\s*\}/g,
    /\b(?:href|url)\s*:\s*["'](\/[^"']*)["']/g,
    /\b(?:href|url)\s*=\s*\{\s*`(\/[^`]*)`\s*\}/g,
    /\b(?:href|url)\s*:\s*`(\/[^`]*)`/g,
  ];
  if (file === "app/sitemap.ts") patterns.push(/["'](\/[^"']*)["']/g);
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (!match[1].includes("${")) links.push(match[1]);
    }
  }
  return links;
}

function hasNavigationRouteMethod(source) {
  return /\bexport\s+(?:async\s+)?function\s+(?:GET|HEAD)\b/.test(source)
    || /\bexport\s+const\s+(?:GET|HEAD)\b/.test(source)
    || /\bexport\s*\{[^}]*\b(?:GET|HEAD)\b[^}]*\}/s.test(source);
}

function resolveInternalPath(pathname, context) {
  if (context.redirectSources.has(pathname)) return `${pathname} is a redirect source; link to its canonical destination`;
  if (context.publicAssets.has(pathname) || context.staticPages.has(pathname)) return null;
  // Runtime dynamic pages remain structural. This check intentionally comes
  // before finite-family rejection so a more-specific runtime route nested
  // under a finite catch-all resolves without admitting other fake members.
  if (context.runtimeDynamicPages.some((pagePattern) => matchesPagePattern(pagePattern, pathname))) return null;
  if (context.finitePaths.has(pathname)) return null;
  const finitePattern = [...context.finiteByPattern.keys()].find((pagePattern) => matchesPagePattern(pagePattern, pathname));
  if (finitePattern) return `${pathname} is not a registered member of finite route family ${finitePattern}`;
  return `${pathname} does not resolve to an application page or public asset`;
}

function addLink(errors, internalLinks, value, source, context, options) {
  const parsed = parseRouteHref(value, options);
  if (parsed.error) {
    errors.push(`${source} has malformed link ${JSON.stringify(value)}: ${parsed.error}.`);
    return;
  }
  const resolutionError = resolveInternalPath(parsed.pathname, context);
  if (resolutionError) errors.push(`${source} references ${resolutionError}.`);
  if (!internalLinks.has(value)) internalLinks.set(value, new Set());
  internalLinks.get(value).add(source);
}

function validateComputedCollections({ sitemapEntries, searchItems, errors, internalLinks, context, canonicalSiteOrigin }) {
  if (!Array.isArray(sitemapEntries)) errors.push("sitemap() must return an array.");
  else {
    const sitemapPaths = new Set();
    for (const [index, entry] of sitemapEntries.entries()) {
      if (!entry || typeof entry !== "object" || Array.isArray(entry) || typeof entry.url !== "string") {
        errors.push(`sitemap()[${index}] must contain a string url.`);
        continue;
      }
      const parsed = parseRouteHref(entry.url, { allowAbsolute: true, canonicalSiteOrigin });
      if (parsed.error) {
        errors.push(`sitemap()[${index}] has malformed link ${JSON.stringify(entry.url)}: ${parsed.error}.`);
        continue;
      }
      if (sitemapPaths.has(parsed.pathname)) errors.push(`sitemap() contains duplicate path ${parsed.pathname}.`);
      sitemapPaths.add(parsed.pathname);
      addLink(errors, internalLinks, entry.url, `sitemap()[${index}]`, context, { allowAbsolute: true, canonicalSiteOrigin });
    }
  }

  if (!Array.isArray(searchItems)) errors.push("globalSearchItems must be an array.");
  else {
    for (const [index, item] of searchItems.entries()) {
      if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.href !== "string") {
        errors.push(`globalSearchItems[${index}] must contain a string href.`);
        continue;
      }
      addLink(errors, internalLinks, item.href, `globalSearchItems[${index}]`, context);
    }
  }
}

export function validatePublicLinkModel({
  pageEntries,
  routeEntries = [],
  sourceEntries,
  publicAssetPaths = [],
  finiteDefinitions,
  sitemapEntries = [],
  searchItems = [],
  resourceSource = "",
  discordUrl = "https://discord.gg/example",
  redirectSourcePaths = [],
  canonicalSiteOrigin = "https://engineeringfoundry.dev",
}) {
  const errors = [];
  const pages = pageEntries.map((entry) => ({
    ...entry,
    pagePattern: entry.pagePattern ?? pagePatternFromFile(entry.file),
    dynamicParamsFalse: entry.dynamicParamsFalse ?? finiteDeclarationPattern.test(entry.source),
  }));
  const routes = routeEntries.map((entry) => ({
    ...entry,
    pagePattern: entry.pagePattern ?? pagePatternFromFile(entry.file),
    navigationReachable: entry.navigationReachable ?? hasNavigationRouteMethod(entry.source),
  }));
  for (const page of pages) {
    if (!page.pagePattern || !isValidPagePattern(page.pagePattern)) errors.push(`${page.file} does not map to a valid App Router page pattern.`);
  }

  const { finiteByPattern, finitePaths } = validateFiniteDefinitions(finiteDefinitions, pages, errors);
  const context = {
    finiteByPattern,
    finitePaths,
    publicAssets: new Set(publicAssetPaths),
    redirectSources: new Set(redirectSourcePaths),
    staticPages: new Set([...pages, ...routes.filter((route) => route.navigationReachable)].filter((entry) => !isDynamicPagePattern(entry.pagePattern ?? "")).map((entry) => entry.pagePattern)),
    runtimeDynamicPages: [...pages.filter((page) => !page.dynamicParamsFalse), ...routes.filter((route) => route.navigationReachable)]
      .filter((entry) => isDynamicPagePattern(entry.pagePattern ?? ""))
      .map((entry) => entry.pagePattern),
  };
  const internalLinks = new Map();

  for (const { file, source } of sourceEntries) {
    for (const link of extractLiteralInternalLinks(source, file)) addLink(errors, internalLinks, link, file, context);
    for (const tag of source.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/g)) {
      const rel = tag[0].match(/rel=["']([^"']+)["']/)?.[1] ?? "";
      const relTokens = rel.split(/\s+/);
      if (!relTokens.includes("noopener") || !relTokens.includes("noreferrer")) {
        errors.push(`${file} has a new-tab link without rel="noopener noreferrer".`);
      }
    }
  }

  validateComputedCollections({ sitemapEntries, searchItems, errors, internalLinks, context, canonicalSiteOrigin });

  for (const marker of [/http:\/\//i, /[?&](?:utm_[^=]*|ref|affiliate)=/i]) {
    if (marker.test(resourceSource)) errors.push(`Curated resources matched prohibited external-link pattern ${marker}.`);
  }
  if (!isCanonicalDiscordInvite(discordUrl)) errors.push("Configured Discord fallback must use a canonical HTTPS discord.gg invite without credentials, a port, query, or fragment.");

  return { errors, internalLinkCount: internalLinks.size, pageCount: pages.length };
}

async function loadEntries(repositoryRoot, files) {
  return Promise.all(files.map(async (file) => ({ file: normalizedFilePath(file), source: await readFile(path.join(repositoryRoot, file), "utf8") })));
}

async function findPublicAssetPaths(repositoryRoot) {
  const files = await walkFiles(repositoryRoot, "public", [""]);
  return files
    .filter((file) => statSync(path.join(repositoryRoot, file)).isFile())
    .map((file) => `/${normalizedFilePath(file).slice("public/".length)}`);
}

export async function validatePublicLinks({
  repositoryRoot = defaultRepositoryRoot,
  finiteDefinitions = finitePublicRouteDefinitions,
  sitemapEntries = sitemap(),
  searchItems = globalSearchItems,
  canonicalSiteOrigin = new URL(siteConfig.url).origin,
  discordUrl = siteConfig.discordUrl,
  redirectSourcePaths = publicRedirectSourcePaths,
} = {}) {
  const pageFiles = await walkFiles(repositoryRoot, "app", ["page.tsx"]);
  const routeFiles = await walkFiles(repositoryRoot, "app", ["route.ts"]);
  const sourceFiles = (await Promise.all(sourceDirectories.map((directory) => walkFiles(repositoryRoot, directory, sourceExtensions)))).flat();
  const [pageEntries, routeEntries, sourceEntries, assets, resourceSource] = await Promise.all([
    loadEntries(repositoryRoot, pageFiles),
    loadEntries(repositoryRoot, routeFiles),
    loadEntries(repositoryRoot, sourceFiles),
    findPublicAssetPaths(repositoryRoot),
    readFile(path.join(repositoryRoot, "data/resources/resources.json"), "utf8"),
  ]);
  return validatePublicLinkModel({
    pageEntries,
    routeEntries,
    sourceEntries,
    publicAssetPaths: assets,
    finiteDefinitions,
    sitemapEntries,
    searchItems,
    canonicalSiteOrigin,
    resourceSource,
    discordUrl,
    redirectSourcePaths,
  });
}

async function main() {
  const report = await validatePublicLinks();
  if (report.errors.length) {
    console.error(`Public link validation failed:\n- ${report.errors.join("\n- ")}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Public link validation passed: ${report.internalLinkCount} literal and computed internal links resolve to ${report.pageCount} application pages; finite-route, new-tab, and curated external-link rules passed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await main();
