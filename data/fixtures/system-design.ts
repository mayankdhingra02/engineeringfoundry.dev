export interface SystemDesignProblem {
  slug: string;
  title: string;
  description: string;
  status: "placeholder";
}

export const systemDesignProblems: SystemDesignProblem[] = [
  { slug: "url-shortener", title: "URL Shortener", description: "Practice requirements, identifiers, storage, caching, and redirect reliability.", status: "placeholder" },
  { slug: "notification-service", title: "Notification Service", description: "Practice fan-out, delivery channels, retries, preferences, and observability.", status: "placeholder" },
  { slug: "chat-system", title: "Chat System", description: "Practice real-time delivery, presence, ordering, storage, and multi-device sync.", status: "placeholder" },
];

export function getSystemDesignProblem(slug: string) {
  return systemDesignProblems.find((problem) => problem.slug === slug);
}
