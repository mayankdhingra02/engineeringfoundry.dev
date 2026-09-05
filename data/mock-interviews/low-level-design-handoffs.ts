const mockPlanToPracticeSlug = {
  "parking-lot": "parking-allocation",
  "elevator-control": "elevator-dispatch",
  "vending-machine": "vending-workflow",
  "amazon-locker-parcel-locker": "package-delivery-lifecycle",
  "conference-room-booking": "meeting-room-scheduler",
  "notification-system": "notification-orchestrator",
} as const;

export const lowLevelDesignPracticeToMockPlanSlug: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(mockPlanToPracticeSlug).map(([mockPlanSlug, practiceSlug]) => [practiceSlug, mockPlanSlug]),
);

export function getLowLevelDesignMockPlanSlug(practiceSlug: string): string | null {
  return lowLevelDesignPracticeToMockPlanSlug[practiceSlug] ?? null;
}

export function getLowLevelDesignPracticeSlug(mockPlanSlug: string): string | null {
  return mockPlanToPracticeSlug[mockPlanSlug as keyof typeof mockPlanToPracticeSlug] ?? null;
}
