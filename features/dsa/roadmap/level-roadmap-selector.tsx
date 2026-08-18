import { Check } from "lucide-react";
import type { RoadmapLevel } from "@/data/dsa/level-roadmaps";
import { dsaRoadmapLevels } from "@/data/dsa/level-roadmaps";

export function LevelRoadmapSelector({ selectedLevel, onSelect, disabled = false }: { selectedLevel: RoadmapLevel | null; onSelect: (level: RoadmapLevel) => void; disabled?: boolean }) {
  return <div className="dsa-level-roadmap-selector" role="group" aria-label="Choose an interview level">
    {dsaRoadmapLevels.map((option) => {
      const selected = option.level === selectedLevel;
      return <button key={option.level} type="button" disabled={disabled} className={selected ? "selected" : undefined} aria-pressed={selected} onClick={() => onSelect(option.level)}>
        <span className="dsa-level-roadmap-selector-title"><strong>{option.shortTitle}</strong>{selected && <Check size={16} aria-hidden="true" />}</span>
        <span>{option.subtitle}</span>
      </button>;
    })}
  </div>;
}
