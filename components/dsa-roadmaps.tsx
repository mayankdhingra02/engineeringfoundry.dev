"use client";

import Link from "next/link";
import { ArrowRight, CalendarRange, Target } from "lucide-react";
import { useState } from "react";
import { dsaRoadmapDurations, dsaRoadmapRoles } from "@/data/dsa/roadmaps";

export function RoadmapSelector() {
  const [role, setRole] = useState("sde-2");
  const [duration, setDuration] = useState("60");
  return <div className="dsa-roadmap-selector">
    <div><Target size={19} /><label><span>Target role</span><select value={role} onChange={(event) => setRole(event.target.value)}>{dsaRoadmapRoles.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}</select></label></div>
    <div><CalendarRange size={19} /><label><span>Preparation window</span><select value={duration} onChange={(event) => setDuration(event.target.value)}>{dsaRoadmapDurations.map((days) => <option value={days} key={days}>{days} days</option>)}</select></label></div>
    <Link className="button" href={`/dsa/roadmaps/${role}/${duration}-day`}>Open roadmap <ArrowRight size={15} /></Link>
  </div>;
}
