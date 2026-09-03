import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  matchesPagePattern,
  pagePatternFromFile,
  validatePublicLinkModel,
  validatePublicLinks,
} from "./validate-public-links.mjs";
import {
  buildChallengeStaticParams,
  buildCompanyStaticParams,
  buildDsaStaticParams,
  buildInterviewExperienceStaticParams,
  buildInterviewRoundStaticParams,
  buildLowLevelDesignLessonStaticParams,
  buildLowLevelDesignPracticeStaticParams,
  buildMlDesignStaticParams,
  buildSalaryNegotiationStaticParams,
  buildSystemDesignStaticParams,
  finitePublicRouteDefinitions,
  publicRedirectSourcePaths,
} from "../lib/public-route-inventory.ts";

const expectedFiniteFamilies = [
  "/challenges/[slug]",
  "/companies/[slug]",
  "/dsa/[...segments]",
  "/interview-experiences/[company]",
  "/interview-tips/rounds/[slug]",
  "/low-level-design/lessons/[slug]",
  "/low-level-design/practice/[slug]",
  "/ml-design/[slug]",
  "/salary-negotiation/[slug]",
  "/system-design/[...segments]",
].sort();

const productionFamilyCases = [
  ["/challenges/[slug]", buildChallengeStaticParams, "app/challenges/[slug]/page.tsx", "buildChallengeStaticParams"],
  ["/companies/[slug]", buildCompanyStaticParams, "app/companies/[slug]/page.tsx", "buildCompanyStaticParams"],
  ["/dsa/[...segments]", buildDsaStaticParams, "app/dsa/[...segments]/page.tsx", "buildDsaStaticParams"],
  ["/interview-experiences/[company]", buildInterviewExperienceStaticParams, "app/interview-experiences/[company]/page.tsx", "buildInterviewExperienceStaticParams"],
  ["/interview-tips/rounds/[slug]", buildInterviewRoundStaticParams, "app/interview-tips/rounds/[slug]/page.tsx", "buildInterviewRoundStaticParams"],
  ["/low-level-design/lessons/[slug]", buildLowLevelDesignLessonStaticParams, "app/low-level-design/lessons/[slug]/page.tsx", "buildLowLevelDesignLessonStaticParams"],
  ["/low-level-design/practice/[slug]", buildLowLevelDesignPracticeStaticParams, "app/low-level-design/practice/[slug]/page.tsx", "buildLowLevelDesignPracticeStaticParams"],
  ["/ml-design/[slug]", buildMlDesignStaticParams, "app/ml-design/[slug]/page.tsx", "buildMlDesignStaticParams"],
  ["/salary-negotiation/[slug]", buildSalaryNegotiationStaticParams, "app/salary-negotiation/[slug]/page.tsx", "buildSalaryNegotiationStaticParams"],
  ["/system-design/[...segments]", buildSystemDesignStaticParams, "app/system-design/[...segments]/page.tsx", "buildSystemDesignStaticParams"],
];

function pathFromParams(pagePattern, params) {
  const segments = pagePattern.slice(1).split("/");
  return `/${segments.flatMap((segment) => {
    const catchAllName = segment.match(/^\[\.\.\.(.+)\]$/)?.[1];
    if (catchAllName) return params[catchAllName];
    const dynamicName = segment.match(/^\[(.+)\]$/)?.[1];
    return dynamicName ? [params[dynamicName]] : [segment];
  }).join("/")}`;
}

const syntheticPages = [
  { file: "app/page.tsx", source: "export default function Page() { return <main />; }" },
  { file: "app/about/page.tsx", source: "export default function Page() { return <main />; }" },
  { file: "app/products/[slug]/page.tsx", source: "export const dynamicParams = false; export default function Page() { return <main />; }" },
  { file: "app/catalog/[...segments]/page.tsx", source: 'export const dynamicParams = false; if (segments.length === 1 && segments[0] === "legacy") permanentRedirect("/catalog/current");' },
  { file: "app/u/[username]/page.tsx", source: "export default function Page() { return <main />; }" },
  { file: "app/catalog/items/[id]/attempt/[attemptId]/page.tsx", source: "export default function Page() { return <main />; }" },
];

const syntheticDefinitions = [
  { pagePattern: "/products/[slug]", paths: ["/products/valid"] },
  { pagePattern: "/catalog/[...segments]", paths: ["/catalog/current", "/catalog/legacy"] },
];

function validateSynthetic(overrides = {}) {
  return validatePublicLinkModel({
    pageEntries: syntheticPages,
    routeEntries: [{ file: "app/api/export/route.ts", source: "export async function GET() {}" }],
    sourceEntries: [],
    publicAssetPaths: ["/asset.svg"],
    finiteDefinitions: syntheticDefinitions,
    redirectSourcePaths: ["/catalog/legacy"],
    canonicalSiteOrigin: "https://engineeringfoundry.dev",
    ...overrides,
  });
}

function expectValid(report, message) {
  assert.deepEqual(report.errors, [], message ?? report.errors.join("\n"));
}

function expectError(report, pattern) {
  assert.match(report.errors.join("\n"), pattern);
}

assert.deepEqual(
  finitePublicRouteDefinitions.map((definition) => definition.pagePattern).sort(),
  expectedFiniteFamilies,
  "the production inventory must register all ten and only the ten current dynamicParams=false public page families",
);
for (const definition of finitePublicRouteDefinitions) {
  assert.ok(definition.paths.length > 0, `${definition.pagePattern} must have concrete production paths`);
  assert.equal(new Set(definition.paths).size, definition.paths.length, `${definition.pagePattern} paths must be deduplicated`);
}
const productionDefinitionsByPattern = new Map(finitePublicRouteDefinitions.map((definition) => [definition.pagePattern, definition]));
const productionFinitePages = productionFamilyCases.map(([pagePattern, , file]) => ({ pagePattern, file, source: "export const dynamicParams = false;" }));
for (const [pagePattern, buildStaticParams, file, builderName] of productionFamilyCases) {
  const definition = productionDefinitionsByPattern.get(pagePattern);
  const generatedPaths = buildStaticParams().map((params) => pathFromParams(pagePattern, params)).sort();
  assert.deepEqual(generatedPaths, [...definition.paths].sort(), `${builderName} must generate exactly ${pagePattern}'s registered paths`);
  const pageSource = await readFile(file, "utf8");
  assert.match(
    pageSource,
    new RegExp(`export\\s+function\\s+generateStaticParams\\(\\)\\s*\\{[\\s\\S]{0,160}return\\s+${builderName}\\(\\);?\\s*\\}`),
    `${file} must delegate generateStaticParams to ${builderName}`,
  );
  const fakePath = pagePattern.replace(/\[\.\.\.[^\]]+\]/, "__not-a-real-route__/nested").replace(/\[[^\]]+\]/, "__not-a-real-route__");
  expectError(validatePublicLinkModel({
    pageEntries: productionFinitePages,
    sourceEntries: [{ file: "components/fabricated-link.tsx", source: `<a href="${fakePath}">Fabricated</a>` }],
    finiteDefinitions: finitePublicRouteDefinitions,
  }), /not a registered member of finite route family/);
}

assert.equal(pagePatternFromFile("app/page.tsx"), "/");
assert.equal(pagePatternFromFile("app/(public)/companies/[slug]/page.tsx"), "/companies/[slug]");
assert.equal(pagePatternFromFile("app/api/account/export/route.ts"), "/api/account/export");
assert.equal(matchesPagePattern("/catalog/[...segments]", "/catalog/one/two"), true);
assert.equal(matchesPagePattern("/catalog/[...segments]", "/catalog"), false);
assert.equal(matchesPagePattern("/u/[username]", "/u/person"), true);
assert.equal(matchesPagePattern("/u/[username]", "/u/person/extra"), false);
assert.equal(matchesPagePattern("/catalog/items/[id]/attempt/[attemptId]", "/catalog/items//attempt/attempt"), false);
assert.deepEqual(publicRedirectSourcePaths, ["/sign-in", "/sign-up", "/dsa/interview-strategy"]);

expectValid(validateSynthetic({
  sourceEntries: [{
    file: "components/links.tsx",
    source: '<a href="/about#team">About</a><a href="/products/valid?tab=one#details">Product</a><a href="/u/person">Profile</a><a href="/catalog/items/item/attempt/attempt">Attempt</a><a href="/api/export">Export</a><a href="/asset.svg?download=1">Asset</a>',
  }],
  sitemapEntries: [{ url: "https://engineeringfoundry.dev/products/valid" }],
  searchItems: [{ href: "/products/valid?query=kept#section" }],
}), "static, asset, exact finite, normalized query/hash, API, runtime dynamic, and more-specific runtime paths should resolve");

expectError(validateSynthetic({
  sourceEntries: [{ file: "components/fake.tsx", source: '<a href="/products/fake">Fake</a>' }],
}), /not a registered member of finite route family \/products\/\[slug\]/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/fake-template.tsx", source: '<a href={`/products/fake`}>Fake</a>' }],
}), /not a registered member of finite route family \/products\/\[slug\]/);
expectValid(validateSynthetic({
  sourceEntries: [{ file: "components/valid-template.tsx", source: '<a href={`/products/valid`}>Valid</a>' }],
}));
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/case.tsx", source: '<a href="/products/Valid">Case mismatch</a>' }],
}), /\/products\/Valid is not a registered member/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/extra.tsx", source: '<a href="/products/valid/extra">Extra segment</a>' }],
}), /does not resolve to an application page or public asset/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/fake-catchall.tsx", source: '<a href="/catalog/not-real/deep">Fake catch-all member</a>' }],
}), /not a registered member of finite route family \/catalog\/\[\.\.\.segments\]/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/redirect.tsx", source: '<a href="/catalog/legacy">Legacy</a>' }],
}), /redirect source; link to its canonical destination/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/malformed.tsx", source: '<a href="/products/valid/../other">Malformed</a>' }],
}), /contains a non-canonical path/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/whitespace.tsx", source: '<a href="/products/valid bad">Malformed</a>' }],
}), /contains whitespace/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/empty-segment.tsx", source: '<a href="/catalog/items//attempt/attempt">Malformed</a>' }],
}), /empty path segment/);

expectError(validateSynthetic({
  pageEntries: [...syntheticPages, { file: "app/unregistered/[slug]/page.tsx", source: "export const dynamicParams = false;" }],
}), /exports dynamicParams = false but \/unregistered\/\[slug\] is not registered/);
expectError(validateSynthetic({
  finiteDefinitions: [...syntheticDefinitions, syntheticDefinitions[0]],
}), /Duplicate finite route definition for \/products\/\[slug\]/);
expectError(validateSynthetic({
  finiteDefinitions: [
    { pagePattern: "/products/[slug]", paths: ["/products/valid", "/products/valid"] },
    syntheticDefinitions[1],
  ],
}), /Duplicate finite path \/products\/valid/);
expectError(validateSynthetic({
  finiteDefinitions: [
    { pagePattern: "/products/[slug]", paths: ["/wrong/valid"], unexpected: true },
    syntheticDefinitions[1],
  ],
}), /must contain only pagePattern and paths|does not belong to/);
expectError(validateSynthetic({
  finiteDefinitions: [
    { pagePattern: "/products/[slug]", paths: ["/products/valid?preview=1"] },
    syntheticDefinitions[1],
  ],
}), /canonical concrete path without query/);

expectError(validateSynthetic({ sitemapEntries: [{ url: "https://evil.test/products/valid" }] }), /exact canonical site origin/);
expectError(validateSynthetic({ sitemapEntries: [{ url: "http://engineeringfoundry.dev/products/valid" }] }), /exact canonical site origin/);
expectError(validateSynthetic({ sitemapEntries: [{ url: "https://user@engineeringfoundry.dev/products/valid" }] }), /exact canonical site origin/);
expectError(validateSynthetic({ sitemapEntries: [{ url: "https:engineeringfoundry.dev/products/valid" }] }), /exact canonical site origin/);
expectError(validateSynthetic({ sitemapEntries: [{ url: "https://engineeringfoundry.dev:443/products/valid" }] }), /exact canonical site origin/);
expectError(validateSynthetic({ sitemapEntries: [{ url: "https://engineeringfoundry.dev/products/valid/../valid" }] }), /contains a non-canonical path/);
expectError(validateSynthetic({ sitemapEntries: [{ url: "https://engineeringfoundry.dev/products/valid?preview=1" }] }), /must not contain a query or fragment/);
expectError(validateSynthetic({ sitemapEntries: [{ url: "https://engineeringfoundry.dev/products/valid" }, { url: "https://engineeringfoundry.dev/products/valid" }] }), /duplicate path \/products\/valid/);
expectError(validateSynthetic({ searchItems: [{ href: "/products/not-computed" }] }), /not a registered member/);
expectError(validateSynthetic({ searchItems: [{ title: "Missing href" }] }), /must contain a string href/);

expectValid(validateSynthetic({
  sourceEntries: [{ file: "components/external.tsx", source: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">External</a>' }],
}));
expectError(validateSynthetic({
  sourceEntries: [{ file: "components/external.tsx", source: '<a href="https://example.com" target="_blank">External</a>' }],
}), /new-tab link without rel="noopener noreferrer"/);
expectError(validateSynthetic({
  sourceEntries: [{ file: "features/external.tsx", source: '<a href="https://example.com" target="_blank">External</a>' }],
}), /new-tab link without rel="noopener noreferrer"/);
expectError(validateSynthetic({
  routeEntries: [{ file: "app/api/write-only/route.ts", source: "export async function POST() {}" }],
  sourceEntries: [{ file: "components/post-route.tsx", source: '<a href="/api/write-only">Write only</a>' }],
}), /does not resolve to an application page or public asset/);
expectError(validateSynthetic({
  routeEntries: [{
    file: "app/api/comment-only/route.ts",
    source: '// export function GET() must not make this navigable\nexport async function POST() { return new Response("ok"); }',
  }],
  sourceEntries: [{ file: "components/comment-route.tsx", source: '<a href="/api/comment-only">Comment only</a>' }],
}), /does not resolve to an application page or public asset/);
for (const [routeName, routeSource] of [
  ["default-get", "export default function GET() { return new Response(); }"],
  ["type-only-get", 'export type { GET } from "./types";'],
]) {
  expectError(validateSynthetic({
    routeEntries: [{ file: `app/api/${routeName}/route.ts`, source: routeSource }],
    sourceEntries: [{ file: `components/${routeName}.tsx`, source: `<a href="/api/${routeName}">Not navigable</a>` }],
  }), /does not resolve to an application page or public asset/);
}
expectError(validateSynthetic({ resourceSource: '[{"url":"http://example.com"}]' }), /prohibited external-link pattern/);
expectValid(validateSynthetic({ discordUrl: "https://discord.gg/invite" }));
for (const discordUrl of [
  "https://example.com/https://discord.gg/invite",
  "https://discord.gg.evil.test/invite",
  "https://user@discord.gg/invite",
  "https:discord.gg/invite",
  "https://discord.gg/",
  "https://discord.gg/invite?campaign=unsafe",
  "https://discord.gg/invite#fragment",
  "https://discord.gg:443/invite",
  "https://discord.gg/invite/../other",
  "https://discord.gg//invite",
]) {
  expectError(validateSynthetic({ discordUrl }), /Discord fallback/);
}

const productionReport = await validatePublicLinks();
expectValid(productionReport, `production sitemap, globalSearchItems, literal links, pages, and assets must resolve:\n${productionReport.errors.join("\n")}`);

console.log(`Public link regression passed: all ${expectedFiniteFamilies.length} finite families plus synthetic membership, canonicalization, computed-source, runtime-route, asset, and security controls passed; ${productionReport.internalLinkCount} production links resolved.`);
