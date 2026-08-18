import type { CoreRoadmapTopic } from "@/data/dsa/core-roadmap";
import { ROADMAP_NODE_HEIGHT, ROADMAP_NODE_WIDTH } from "./roadmap-layout";

export function RoadmapNode({ topic, x, y, questionCount, selected, highlighted, faded, onSelect, onHover }: {
  topic: CoreRoadmapTopic;
  x: number;
  y: number;
  questionCount: number;
  selected: boolean;
  highlighted: boolean;
  faded: boolean;
  onSelect: () => void;
  onHover: (id: string | null) => void;
}) {
  return <button
    type="button"
    className={`dsa-roadmap-node ${topic.level}${selected ? " selected" : ""}${highlighted ? " highlighted" : ""}${faded ? " faded" : ""}`}
    style={{ left: x, top: y, width: ROADMAP_NODE_WIDTH, height: ROADMAP_NODE_HEIGHT }}
    aria-pressed={selected}
    aria-label={`${topic.title}, ${topic.level}${questionCount ? `, ${questionCount} practice question${questionCount === 1 ? "" : "s"}` : ""}`}
    onClick={onSelect}
    onMouseEnter={() => onHover(topic.id)}
    onMouseLeave={() => onHover(null)}
  >
    <strong>{topic.title}</strong>
    <span>{topic.level === "foundations" ? "Foundation" : topic.level === "core" ? "Core pattern" : "Advanced"}{questionCount > 0 && <small>{questionCount} Q</small>}</span>
  </button>;
}
