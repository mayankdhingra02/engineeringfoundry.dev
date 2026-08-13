import guidanceData from "./guidance.json";
import templatesData from "./templates.json";
import type { ReferralGuidanceCollection, ReferralTemplate } from "@/types";

export const referralGuidance = guidanceData as ReferralGuidanceCollection;
export const referralTemplates = templatesData as ReferralTemplate[];
