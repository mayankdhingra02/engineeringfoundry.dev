export const homeCoreTracks = [
  { id: "dsa", title: "DSA", bestFor: "Best for coding rounds", description: "Learn patterns, build a roadmap, and practice company-tagged questions.", href: "/dsa", action: "Open DSA" },
  { id: "system-design", title: "System Design", bestFor: "Best for architecture rounds", description: "Learn core concepts, focus your plan, and practice 50+ designs.", href: "/system-design/start-here/introduction", action: "Start learning" },
  { id: "ml-design", title: "ML System Design", bestFor: "Best for ML architecture rounds", description: "Connect product goals to data, training, evaluation, serving, monitoring, and feedback loops.", href: "/ml-design", action: "Prepare ML systems" },
  { id: "behavioral", title: "Behavioral", bestFor: "Best for story-based rounds", description: "Shape evidence around impact, judgment, leadership, and growth.", href: "/behavioral", action: "Prepare stories" },
] as const;

export const homeSupportingTracks = [
  { id: "low-level-design", title: "Low-Level Design", description: "Responsibilities, interfaces, and state", href: "/low-level-design" },
  { id: "companies", title: "Company Interview Guides", description: "Interview process and round context", href: "/companies" },
  { id: "interview-execution", title: "Interview Execution Guide", description: "Communication, recovery, and closing", href: "/interview-tips" },
] as const;
