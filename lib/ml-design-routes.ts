export const ML_DESIGN_ROOT = "/ml-design";
export const ML_DESIGN_CONCEPTS_ROOT = "/ml-design/core-concepts";
export const ML_DESIGN_PROBLEMS_ROOT = "/ml-design/problems";
export const ML_DESIGN_PRACTICE_ROOT = "/ml-design/practice";
export const ML_DESIGN_RUBRIC = "/ml-design/rubric";
export const ML_DESIGN_GLOSSARY = "/ml-design/glossary";

export const mlDesignLegacyProblemSlugs = {
  "recommendation-system": "personalized-recommendation",
  "search-ranking": "search-ranking-retrieval",
  "fraud-detection": "real-time-payment-fraud",
  "spam-abuse-detection": "trust-safety-decision-system",
  "feed-ranking": "social-content-feed-ranking",
  "semantic-search": "search-ranking-retrieval",
  "rag-knowledge-assistant": "production-rag-assistant",
} as const;

export function mlDesignConceptHref(slug: string): `/ml-design/core-concepts/${string}` {
  return `${ML_DESIGN_CONCEPTS_ROOT}/${slug}`;
}

export function mlDesignProblemHref(slug: string): `/ml-design/problems/${string}` {
  return `${ML_DESIGN_PROBLEMS_ROOT}/${slug}`;
}

export function legacyMlDesignProblemHref(slug: string): `/ml-design/${string}` {
  return `${ML_DESIGN_ROOT}/${slug}`;
}
