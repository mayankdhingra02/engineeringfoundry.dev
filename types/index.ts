export type Difficulty = "Easy" | "Medium" | "Hard";

export type VerificationStatus = "verified" | "community-reported" | "unverified" | "demo";
export type SourcePlatform = "leetcode" | "hackerrank" | "codeforces" | "geeksforgeeks" | "official" | "community" | "original" | "other";
export type ContentStatus = "active" | "unavailable" | "needs_review";

export interface ProvenanceSource {
  name: string;
  platform: SourcePlatform;
  url: string | null;
  verification: VerificationStatus;
  lastVerifiedAt: string | null;
  notes?: string;
}

export interface CompanyAssociation {
  companySlug: string;
  verification: VerificationStatus;
  source: ProvenanceSource;
}

export interface DsaQuestion {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topics: string[];
  patterns: string[];
  companyAssociations: CompanyAssociation[];
  roadmapStage: string;
  priority: 1 | 2 | 3;
  isFree: boolean;
  isOriginal: boolean;
  status: ContentStatus;
  verification: VerificationStatus;
  lastVerifiedAt: string | null;
  externalUrl: string | null;
  source: ProvenanceSource;
  note: string;
  originalPrompt?: string;
}

export interface DsaTopic {
  id: string;
  slug: string;
  name: string;
  summary: string;
  interviewUse: string;
  complexityFocus: string;
  commonMistakes: string[];
  relatedTopics: string[];
}

export interface DsaPattern {
  id: string;
  slug: string;
  name: string;
  summary: string;
  recognitionSignals: string[];
  commonMistakes: string[];
}

export interface RoadmapStage {
  id: string;
  slug: string;
  order: number;
  title: string;
  description: string;
  topics: string[];
  patterns: string[];
}

export interface CompanyGuide {
  id: string;
  name: string;
  slug: string;
  description: string;
  guideStatus: "available" | "curating";
  claims: Array<{ claim: string; verification: VerificationStatus; source: ProvenanceSource }>;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "Platform" | "Book" | "Blog" | "Video" | "Course";
  url: string;
  access: "Free" | "Paid" | "Freemium";
  tags: string[];
  demo: boolean;
}

export interface MockInterview {
  id: string;
  type: "DSA" | "System Design" | "ML System Design" | "Behavioral";
  experienceLevel: string;
  status: "Open" | "Matched" | "Scheduled" | "Completed" | "Cancelled";
  startsAt?: string;
}

export type ReferralStatus =
  | "Open"
  | "Under Review"
  | "More Information Requested"
  | "Accepted"
  | "Declined"
  | "Closed";

export interface ReferralRequest {
  id: string;
  companyId: string;
  jobTitle: string;
  jobId?: string;
  jobUrl?: string;
  location?: string;
  introduction: string;
  linkedinUrl?: string;
  message?: string;
  status: ReferralStatus;
  compensation?: { enabled: boolean; amount?: number; currency?: string };
}

export interface Referrer {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  verificationStatus: "Unverified" | "Pending" | "Verified";
  requestsReviewed: number;
  availability: "Open" | "Limited" | "Unavailable";
  jobFamilies: string[];
  bio?: string;
}

export interface InterviewExperience {
  id: string;
  companyId: string;
  role: string;
  level: string;
  interviewDate: string;
  location: string;
  rounds: string[];
  topics: string[];
  experience: string;
  result?: "Offer" | "No offer" | "Withdrew" | "In progress";
  anonymous: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  category: "DSA" | "System Design" | "ML Design" | "Backend Engineering";
  summary: string;
  deadline?: string;
  status: "Upcoming" | "Open" | "Judging" | "Complete";
  score?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
}
