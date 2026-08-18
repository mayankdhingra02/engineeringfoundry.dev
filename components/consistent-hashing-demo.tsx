"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

const allNodes = [
  { id: "A", position: 8 },
  { id: "B", position: 42 },
  { id: "C", position: 76 },
  { id: "D", position: 25 },
  { id: "E", position: 60 },
] as const;
const sampleKeys = [
  { id: "profile:42", position: 4 },
  { id: "video:91", position: 18 },
  { id: "feed:17", position: 37 },
  { id: "image:63", position: 57 },
  { id: "session:8", position: 72 },
  { id: "post:29", position: 91 },
] as const;

function activeNodes(count: number) {
  return [...allNodes.slice(0, count)].sort((left, right) => left.position - right.position);
}

function owner(position: number, count: number) {
  const nodes = activeNodes(count);
  return (nodes.find((node) => node.position >= position) ?? nodes[0]).id;
}

function pointStyle(position: number, radius: number) {
  const radians = (position / 100 * 360 - 90) * Math.PI / 180;
  const coordinate = (value: number) => {
    const rounded = Math.round(value * 1_000) / 1_000;
    return `calc(50% ${rounded < 0 ? "-" : "+"} ${Math.abs(rounded)}px)`;
  };
  return { left: coordinate(Math.cos(radians) * radius), top: coordinate(Math.sin(radians) * radius) };
}

export function ConsistentHashingDemo() {
  const [nodeCount, setNodeCount] = useState(3);
  const [movedKeys, setMovedKeys] = useState<readonly string[]>([]);
  const assignments = useMemo(() => sampleKeys.map((key) => ({ ...key, owner: owner(key.position, nodeCount) })), [nodeCount]);

  function changeNodes(nextCount: number) {
    const before = new Map(assignments.map((key) => [key.id, key.owner]));
    const after = sampleKeys.map((key) => ({ id: key.id, owner: owner(key.position, nextCount) }));
    setMovedKeys(after.filter((key) => before.get(key.id) !== key.owner).map((key) => key.id));
    setNodeCount(nextCount);
  }

  function reset() { setNodeCount(3); setMovedKeys([]); }

  return <section className="sd-hash-demo" aria-labelledby="hash-demo-title">
    <header><span>Interactive model</span><h3 id="hash-demo-title">A changing hash ring</h3><p>Keys belong to the next node clockwise. Add or remove a node to see which sample keys actually move.</p></header>
    <div className="sd-hash-stage">
      <div className="sd-hash-ring" aria-hidden="true">
        {activeNodes(nodeCount).map((node) => <span className={`sd-hash-node sd-hash-node-${node.id.toLowerCase()}`} style={pointStyle(node.position, 105)} key={node.id}>{node.id}</span>)}
        {assignments.map((key) => <span className={`sd-hash-key${movedKeys.includes(key.id) ? " is-moved" : ""}`} style={pointStyle(key.position, 75)} key={key.id} />)}
        <strong>{nodeCount} nodes</strong><small>{sampleKeys.length} sample keys</small>
      </div>
      <div className="sd-hash-side">
        <div className="sd-hash-controls">
          <button type="button" disabled={nodeCount === allNodes.length} onClick={() => changeNodes(nodeCount + 1)}><Plus size={14} />Add node</button>
          <button type="button" disabled={nodeCount === 3} onClick={() => changeNodes(nodeCount - 1)}><Minus size={14} />Remove node</button>
          <button type="button" onClick={reset}><RotateCcw size={14} />Reset</button>
        </div>
        <output aria-live="polite">{movedKeys.length ? `${movedKeys.length} of ${sampleKeys.length} sample keys moved` : "Change the node set to compare ownership"}</output>
        <div className="sd-table-scroll" role="region" aria-label="Current key ownership">
          <table><thead><tr><th>Key</th><th>Position</th><th>Owner</th></tr></thead><tbody>{assignments.map((key) => <tr className={movedKeys.includes(key.id) ? "is-moved" : ""} key={key.id}><td><code>{key.id}</code></td><td>{key.position}</td><td>Node {key.owner}</td></tr>)}</tbody></table>
        </div>
      </div>
    </div>
  </section>;
}
