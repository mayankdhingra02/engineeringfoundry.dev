import type { Resource } from "@/types";
import resourcesData from "./resources.json";

export const resourceCategories = ["DSA", "System Design", "ML / AI", "Behavioral", "Interview Strategy", "Engineering", "Career"] as const;
export const resourceTypes = ["Practice Platform", "Guide", "Course", "Book", "Documentation", "Repository", "Visualization", "Roadmap"] as const;
export const resourceAccessLevels = ["Free", "Paid", "Freemium"] as const;
export const resources = resourcesData as Resource[];
export const activeResources = resources.filter((resource) => resource.status === "active");
