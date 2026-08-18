import { Check } from "lucide-react";
import type { ProblemClassification, RoadmapScopePath } from "@/data/dsa/level-roadmaps";

export function RoadmapScopeFilter({ paths, selectedPath, counts, onSelect }: { paths: readonly RoadmapScopePath[]; selectedPath: string; counts: Record<ProblemClassification, number>; onSelect: (pathId: RoadmapScopePath["id"]) => void }) {
  return <section className="dsa-roadmap-scope-filter" aria-labelledby="roadmap-scope-filter-heading"><div><span>Preparation path</span><h2 id="roadmap-scope-filter-heading">Choose how deep to go.</h2><p>One curriculum, filtered by time. You can change this at any point.</p></div><div role="group" aria-label="Filter roadmap problems">{paths.map((path) => {
    const count = path.classifications.reduce((total, classification) => total + counts[classification], 0);
    const selected = path.id === selectedPath;
    return <button key={path.id} type="button" aria-pressed={selected} className={selected ? "selected" : undefined} onClick={() => onSelect(path.id)}><span><strong>{path.title}</strong>{selected && <Check size={15} aria-hidden="true" />}</span><small>{path.description}</small><b>{count} unique problems</b></button>;
  })}</div></section>;
}
