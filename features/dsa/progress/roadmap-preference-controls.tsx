"use client";

import { useState, useTransition } from "react";
import { savePreferredDsaRoadmapAction, type DsaProgressActionState } from "./actions";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";

const levels = ["sde1", "sde2", "sde3plus"] as const;
const initialState: DsaProgressActionState = { status: "idle", message: "" };

export function RoadmapPreferenceControls({ preferredRoadmap }: { preferredRoadmap: RoadmapLevel }) {
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();
  return <div className="dsa-roadmap-preference-controls">
    <div>{levels.map((level) => <button key={level} type="button" disabled={pending} className={level === preferredRoadmap ? "active" : undefined} aria-pressed={level === preferredRoadmap} onClick={() => startTransition(async () => setState(await savePreferredDsaRoadmapAction(level)))}>{level === "sde3plus" ? "SDE III+" : level.toUpperCase()}</button>)}</div>
    <span className={state.status === "error" ? "error" : undefined} role={state.status === "error" ? "alert" : "status"} aria-live="polite">{pending ? "Saving preferred roadmap…" : state.message}</span>
  </div>;
}
