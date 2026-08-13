export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string;
  focusAreas: string[];
  questionCount?: number;
}

export interface Question {
  id: string;
  title: string;
  difficulty: Difficulty;
  topic: string;
  companies: string[];
  completed: boolean;
  externalUrl: string;
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
