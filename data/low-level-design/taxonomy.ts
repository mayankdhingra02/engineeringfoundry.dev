export const lowLevelDesignLevels = ["Entry", "Mid", "Senior", "Staff+"] as const;
export type LowLevelDesignLevel = (typeof lowLevelDesignLevels)[number];
