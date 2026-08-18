import type { CoreRoadmapTopic, CoreRoadmapTrack } from "@/data/dsa/core-roadmap";

export const ROADMAP_NODE_WIDTH = 176;
export const ROADMAP_NODE_HEIGHT = 62;
export const ROADMAP_GRAPH_WIDTH = 1080;
const ROADMAP_TOP = 26;
const ROADMAP_LEFT = 38;
const ROADMAP_LANE_GAP = 202;
const ROADMAP_ROW_GAP = 98;

export interface RoadmapNodePosition {
  topic: CoreRoadmapTopic;
  x: number;
  y: number;
}

export interface RoadmapEdgeLayout {
  id: string;
  source: string;
  target: string;
  path: string;
}

export interface RoadmapLayout {
  width: number;
  height: number;
  nodes: RoadmapNodePosition[];
  edges: RoadmapEdgeLayout[];
}

export function createRoadmapLayout(track: CoreRoadmapTrack): RoadmapLayout {
  const nodes = track.topics.map((topic) => ({
    topic,
    x: ROADMAP_LEFT + topic.layout.lane * ROADMAP_LANE_GAP,
    y: ROADMAP_TOP + topic.layout.row * ROADMAP_ROW_GAP,
  }));
  const byId = new Map(nodes.map((node) => [node.topic.id, node]));
  const edges = track.topics.flatMap((topic) => topic.prerequisites.map((source) => {
    const from = byId.get(source);
    const to = byId.get(topic.id);
    if (!from || !to) throw new Error(`Cannot lay out roadmap edge ${source} -> ${topic.id}`);
    const sourceX = from.x + ROADMAP_NODE_WIDTH / 2;
    const sourceY = from.y + ROADMAP_NODE_HEIGHT;
    const targetX = to.x + ROADMAP_NODE_WIDTH / 2;
    const targetY = to.y;
    const middleY = sourceY + (targetY - sourceY) / 2;
    return { id: `${source}--${topic.id}`, source, target: topic.id, path: `M ${sourceX} ${sourceY} C ${sourceX} ${middleY}, ${targetX} ${middleY}, ${targetX} ${targetY}` };
  }));
  const maxRow = Math.max(...track.topics.map((topic) => topic.layout.row));
  return { width: ROADMAP_GRAPH_WIDTH, height: ROADMAP_TOP * 2 + maxRow * ROADMAP_ROW_GAP + ROADMAP_NODE_HEIGHT, nodes, edges };
}

export function getRoadmapAncestors(track: CoreRoadmapTrack, topicId: string) {
  const byId = new Map(track.topics.map((topic) => [topic.id, topic]));
  const ancestors = new Set<string>();
  function collect(id: string) {
    for (const prerequisite of byId.get(id)?.prerequisites ?? []) {
      if (ancestors.has(prerequisite)) continue;
      ancestors.add(prerequisite);
      collect(prerequisite);
    }
  }
  collect(topicId);
  return ancestors;
}

export function getRoadmapNeighbors(track: CoreRoadmapTrack, topicId: string) {
  const topic = track.topics.find((item) => item.id === topicId);
  return new Set([...(topic?.prerequisites ?? []), ...track.topics.filter((item) => item.prerequisites.includes(topicId)).map((item) => item.id)]);
}
