"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

export const systemDesignProgressStorageKey = "engineering-foundry-system-design-study-progress-v1";
export const systemDesignProgressEvent = "engineering-foundry-system-design-progress";

export function SystemDesignLessonProgress({ lessonId, lessonSlug }: { lessonId: string; lessonSlug: string }) {
  const practice = lessonId.startsWith("problem-");
  const itemId = practice ? `practice:${lessonId.slice("problem-".length)}` : `topic:${lessonId}`;
  const [status, setStatus] = useState<"not-started" | "in-progress" | "completed">("not-started");

  useEffect(() => {
    let animationFrame = 0;
    try {
      const progress = JSON.parse(window.localStorage.getItem(systemDesignProgressStorageKey) ?? "{}") as Record<string, string>;
      const stored = progress[itemId];
      animationFrame = window.requestAnimationFrame(() => setStatus(stored === "completed" || stored === "in-progress" ? stored : "not-started"));
    } catch { /* Completion remains available in memory when storage is unavailable. */ }
    return () => window.cancelAnimationFrame(animationFrame);
  }, [itemId]);

  function toggle() {
    const nextStatus = practice ? status === "not-started" ? "in-progress" : status === "in-progress" ? "completed" : "not-started" : status === "completed" ? "not-started" : "completed";
    setStatus(nextStatus);
    try {
      const progress = JSON.parse(window.localStorage.getItem(systemDesignProgressStorageKey) ?? "{}") as Record<string, string>;
      progress[itemId] = nextStatus;
      window.localStorage.setItem(systemDesignProgressStorageKey, JSON.stringify(progress));
      window.dispatchEvent(new CustomEvent(systemDesignProgressEvent, { detail: { lessonSlug, status: nextStatus, completed: nextStatus === "completed" } }));
    } catch { /* The visible control still works for this session. */ }
  }

  const label = practice ? status === "not-started" ? "Start practice" : status === "in-progress" ? "Mark practice complete" : "Practice completed" : status === "completed" ? "Lesson completed" : "Mark lesson complete";
  return <button type="button" className="sd-lesson-completion" aria-pressed={status === "completed"} data-status={status} onClick={toggle}>
    <CheckCircle2 size={15} aria-hidden="true" />{label}
  </button>;
}
