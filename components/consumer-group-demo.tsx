"use client";

import { Minus, Plus, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

const partitions = ["P0", "P1", "P2", "P3"];

export function ConsumerGroupDemo() {
  const [consumers, setConsumers] = useState(2);
  const assignments = useMemo(() => partitions.map((partition, index) => ({ partition, consumer: `Consumer ${String.fromCharCode(65 + index % consumers)}` })), [consumers]);
  return <section className="sd-consumer-demo" aria-labelledby="consumer-demo-title">
    <header><span>Interactive model</span><h3 id="consumer-demo-title">Four partitions constrain group parallelism</h3><p>Add or remove group members to see partition ownership rebalance.</p></header>
    <div className="sd-consumer-partitions" aria-hidden="true">{assignments.map((item) => <div key={item.partition}><strong>{item.partition}</strong><span>{item.consumer}</span></div>)}</div>
    <div className="sd-consumer-controls"><button type="button" disabled={consumers === 8} onClick={() => setConsumers((value) => value + 1)}><Plus size={14} />Add consumer</button><button type="button" disabled={consumers === 1} onClick={() => setConsumers((value) => value - 1)}><Minus size={14} />Remove consumer</button><button type="button" onClick={() => setConsumers(2)}><RotateCcw size={14} />Reset</button></div>
    <output aria-live="polite"><strong>{consumers} consumers · {Math.min(consumers, 4)} active</strong><span>{consumers > 4 ? `${consumers - 4} idle because the group has only four partitions.` : "Membership changes reassign partition ownership."}</span></output>
    <div className="sd-table-scroll" role="region" aria-label="Current consumer group assignment"><table><thead><tr><th>Partition</th><th>Owner</th></tr></thead><tbody>{assignments.map((item) => <tr key={item.partition}><td>{item.partition}</td><td>{item.consumer}</td></tr>)}</tbody></table></div>
  </section>;
}
