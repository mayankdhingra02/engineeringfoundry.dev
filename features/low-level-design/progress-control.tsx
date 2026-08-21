"use client";

import { Check, Circle } from "lucide-react";
import { useSyncExternalStore } from "react";
import { track } from "@/lib/analytics";

const storageKey = "engineering-foundry-low-level-design-progress-v1";
const progressEvent = "engineering-foundry-low-level-design-progress";
type Activity = { id: string; updatedAt: number };

function readActivities(): Activity[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Activity => Boolean(item) && typeof item === "object" && typeof (item as Activity).id === "string" && typeof (item as Activity).updatedAt === "number").slice(0, 80);
  } catch { return []; }
}

function subscribe(callback: () => void) {
  window.addEventListener(progressEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(progressEvent, callback);
    window.removeEventListener("storage", callback);
  };
}

export function LowLevelDesignProgressControl({ itemId, analyticsItemId, analyticsItemType, label = "Mark this preparation activity complete" }: { itemId: string; analyticsItemId: string; analyticsItemType: "lesson" | "practice"; label?: string }) {
  const complete = useSyncExternalStore(subscribe, () => readActivities().some((activity) => activity.id === itemId), () => false);
  function toggle() {
    const activities = readActivities();
    const next = complete ? activities.filter((activity) => activity.id !== itemId) : [{ id: itemId, updatedAt: Date.now() }, ...activities.filter((activity) => activity.id !== itemId)].slice(0, 80);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(progressEvent));
    if (!complete) track("low_level_design_activity_recorded", { track: "low-level-design", item_id: analyticsItemId, item_type: analyticsItemType, status: "completed", persistence: "local" });
  }
  return <button type="button" className={`lld-progress-control${complete ? " complete" : ""}`} onClick={toggle} aria-pressed={complete}>
    {complete ? <Check size={16} aria-hidden="true" /> : <Circle size={16} aria-hidden="true" />}{complete ? "Preparation activity recorded" : label}
  </button>;
}
