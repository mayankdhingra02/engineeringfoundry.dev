import { currentHead, writeGovernanceArtifacts } from "./product-blueprint-governance.mjs";

const repositorySha = currentHead();
const result = writeGovernanceArtifacts(process.cwd(), repositorySha);
console.log(`Generated ${result.files.size} product-blueprint governance artifacts for ${repositorySha} (${result.repositoryStateSha256}); changed: ${result.changed.join(", ") || "none"}.`);
