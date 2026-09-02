import { validateCommittedGovernance } from "./product-blueprint-governance.mjs";

const result = validateCommittedGovernance();
console.log(`Product blueprint governance passed: ${result.requirementCount} requirements and ${result.sourceCount} sources describe ${result.repositorySha}; metadata commit ${result.metadataCommit} remains current at ${result.head}.`);
