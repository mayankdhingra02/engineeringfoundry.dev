export const PINNED_NODE_VERSION = "22.13.0";
export const PINNED_NPM_VERSION = "10.9.2";
export const PINNED_SUPABASE_CLI_VERSION = "2.115.0";
export const PRODUCTION_BUILD_COMMAND = "next build";
export const PRODUCTION_BUILD_DESCRIPTION = "Next.js production build using Turbopack";

const npmStep = (script, name = script) => ({ name, command: "npm", args: ["run", script] });

// This is the authoritative static release inventory. CI invokes the lane; it
// does not duplicate these commands in workflow YAML.
export const STATIC_STEPS = [
  npmStep("lint", "ESLint"),
  npmStep("typecheck", "TypeScript"),
  ...[
    "test:content-validator", "test:interview-content-validator", "test:mock-content-validator",
    "test:referral-privacy", "test:challenge-privacy", "test:recognition-integrity",
    "test:experience-privacy", "test:experience-integrity", "test:interview-experiences-v1", "test:public-route-smoke",
    "test:public-launch-integrity", "test:auth-foundation", "test:application-tracker",
    "test:behavioral-workspace", "test:behavioral-v1-polish", "test:analytics-launch-evidence",
    "test:v1-launch-readiness", "test:release-record", "test:feedback-admin-operations", "test:interview-preparation-hub",
    "test:interview-execution-taxonomy", "test:interview-playbook-diagnostic",
    "test:interview-playbook-mock-evidence", "test:interview-playbook-planning",
    "test:interview-playbook-planner-integration", "test:interview-playbook-dsa-evidence",
    "test:interview-playbook-system-design-evidence", "test:interview-playbook-diagnostic-inputs",
    "test:interview-calendar-reminders", "test:interview-reminder-worker", "test:account-lifecycle",
    "test:production-hardening", "test:production-baseline", "test:private-route-privacy",
    "test:canonical-catalog-integrity", "test:persistence-foundation", "test:unified-progress",
    "test:ui-density", "test:typography-readability", "test:local-supabase-helpers",
    "test:homepage-entry", "test:system-design-learning", "test:system-design-entry",
    "test:system-design-manifest", "test:system-design-recommendations", "test:system-design-study-plan",
    "test:system-design-foundations", "test:system-design-networking", "test:system-design-data-storage",
    "test:system-design-caching", "test:system-design-messaging", "test:system-design-reliability",
    "test:system-design-specialized", "test:system-design-technology", "test:system-design-practice",
    "test:system-design-workspace", "test:system-design-release-audit", "test:low-level-design",
    "test:salary-negotiation", "test:dsa-interview-prep", "test:dsa-pattern-index", "test:dsa-roadmap",
    "test:dsa-level-roadmaps", "test:dsa-roadmap-planning", "test:dsa-progress",
    "test:dsa-study-plans", "test:dsa-languages", "test:dsa-strategy",
    "test:company-interview-guide", "test:company-guides", "validate:content",
    "validate:design-content", "validate:interview-content", "validate:mock-content",
    "validate:impact-ledger", "validate:referral-content", "validate:community-content",
    "validate:experience-content", "validate:public-links",
  ].map((script) => npmStep(script)),
];

export const DATABASE_STEPS = [
  { name: "Reset local database from every migration", command: "supabase", args: ["db", "reset", "--local"] },
  { name: "Lint public database schema", command: "supabase", args: ["db", "lint", "--local", "--schema", "public", "--level", "warning", "--fail-on", "error"] },
  { name: "Run pgTAP policy and integrity suite", command: "supabase", args: ["test", "db"] },
  npmStep("qualify:persistence-local", "Two-user persistence isolation"),
  npmStep("qualify:account-lifecycle-local", "Account lifecycle, export, and deletion"),
  npmStep("qualify:auth-local", "Local authentication qualification"),
  npmStep("qualify:security-local", "Local security qualification"),
];

export const PRODUCTION_STEPS = [
  npmStep("build", PRODUCTION_BUILD_DESCRIPTION),
  npmStep("validate:public-links", "Public-link validation"),
  npmStep("test:public-routes", "Built public-route and security-header smoke"),
];

export const RELEASE_QUALIFICATION_COMMANDS = [
  "npm ci",
  "npm run qualify:static",
  "npm run qualify:database",
  "npm run qualify:production",
  "npm run release:verify",
  "git diff --check",
];
