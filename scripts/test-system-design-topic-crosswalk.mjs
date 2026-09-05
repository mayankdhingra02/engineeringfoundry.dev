import assert from "node:assert/strict";
import {
  systemDesignBlueprintCrosswalk,
  systemDesignRepositoryOnlyTopicIds,
} from "../data/system-design/topic-crosswalk.ts";
import { systemDesignTopicManifest } from "../data/system-design/manifest.ts";

const expectedBlueprintRows = 161;
const expectedRepositoryTopics = 188;
const expectedBlueprintOnlyRows = 0;

assert.equal(systemDesignBlueprintCrosswalk.length, expectedBlueprintRows, "The crosswalk must represent every Section 6.4 blueprint row exactly once.");
assert.equal(systemDesignTopicManifest.length, expectedRepositoryTopics, "The reviewed repository side of the crosswalk must remain the 188-topic manifest.");

const blueprintKeys = systemDesignBlueprintCrosswalk.map(({ area, topic }) => `${area}::${topic}`);
assert.equal(new Set(blueprintKeys).size, blueprintKeys.length, "Blueprint area/topic rows must be unique.");

const manifestById = new Map(systemDesignTopicManifest.map((topic) => [topic.id, topic]));
const mappedRepositoryIds = systemDesignBlueprintCrosswalk.flatMap((entry) => entry.repositoryTopicIds);
const repositoryOnlyIds = [...systemDesignRepositoryOnlyTopicIds];
const accountedRepositoryIds = new Set([...mappedRepositoryIds, ...repositoryOnlyIds]);

assert.equal(accountedRepositoryIds.size, expectedRepositoryTopics, "Every repository topic must have a blueprint mapping or an explicit repository-only disposition.");
for (const id of accountedRepositoryIds) {
  const topic = manifestById.get(id);
  assert.ok(topic, `Crosswalk references unknown repository topic ${id}.`);
  assert.match(topic.slug, /^\/system-design\//, `${id} must retain one canonical System Design route outcome.`);
  assert.ok(topic.contentStatus, `${id} must retain an explicit research/content state.`);
  assert.equal(topic.published, topic.contentStatus === "published", `${id} publication state must agree with its content state.`);
}
for (const topic of systemDesignTopicManifest) assert.ok(accountedRepositoryIds.has(topic.id), `${topic.id} is absent from the reviewed crosswalk.`);

const blueprintOnly = systemDesignBlueprintCrosswalk.filter((entry) => entry.disposition === "blueprint-only");
assert.equal(blueprintOnly.length, expectedBlueprintOnlyRows, "Every Required blueprint row must now resolve to published repository content.");
assert.ok(blueprintOnly.every((entry) => entry.repositoryTopicIds.length === 0), "Blueprint-only rows cannot claim a repository route.");
assert.ok(systemDesignBlueprintCrosswalk.filter((entry) => entry.disposition !== "blueprint-only").every((entry) => entry.repositoryTopicIds.length > 0), "Mapped rows need at least one repository topic.");

console.log(`System Design topic crosswalk passed: ${expectedBlueprintRows} blueprint rows reconcile to ${expectedRepositoryTopics} repository topics with no blueprint-only Required outcomes.`);
