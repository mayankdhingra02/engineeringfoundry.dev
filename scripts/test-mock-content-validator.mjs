import { loadInputs, validateMockContent } from "./validate-mock-content.mjs";

const inputs = await loadInputs();
const validate = (overrides = {}) => validateMockContent({ ...inputs, ...overrides });
if (validate().length) throw new Error("The valid mock-interview dataset failed validation");
if (inputs.lowLevelDesignProblems.length !== 59) throw new Error(`Expected 59 LLD mock problems, found ${inputs.lowLevelDesignProblems.length}`);
if (inputs.plans.filter((plan) => plan.track === "low-level-design" && plan.status === "active").length !== 59) throw new Error("Every LLD mock problem must produce one active session plan");

const badReference = structuredClone(inputs.plans);
badReference[0].content_reference.id = "missing-prompt";
const unknownRubric = structuredClone(inputs.plans);
unknownRubric[0].rubric_id = "rubric-missing";
const companyTagged = structuredClone(inputs.plans);
companyTagged[0].companies = ["Example Company"];
const futurePlans = structuredClone(inputs.plans);
for (let index = 0; index < 6; index += 1) {
  const copy = structuredClone(inputs.plans[0]);
  copy.id = `future-plan-${index}`;
  copy.slug = `future-plan-${index}`;
  copy.title = `Future Practice Plan ${index + 1}`;
  copy.status = "needs_review";
  futurePlans.push(copy);
}

const cases = [
  [validate({ plans: badReference }), "invalid prompt reference"],
  [validate({ plans: unknownRubric }), "unknown rubric"],
  [validate({ plans: companyTagged }), "must not contain company associations"],
];
for (const [errors, expected] of cases) {
  if (!errors.some((error) => error.includes(expected))) throw new Error(`Expected validator failure was not produced: ${expected}`);
}
if (validate({ plans: futurePlans }).length) throw new Error("Validator added an unintended maximum session-plan count");

console.log("Mock content validator regression checks passed: 59 LLD prompts, invalid reference, unknown rubric, company tag, and 6 additional future plans.");
