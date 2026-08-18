"use client";

import { useState } from "react";

const examples = { absent: { bits: [0, 3, 6], result: "Definitely not present", detail: "At least one required bit is 0, so the item was not inserted under the filter's assumptions." }, possible: { bits: [1, 4, 7], result: "Possibly present", detail: "All checked bits are 1, but another item may have set them. Verify against authoritative storage." } } as const;

export function BloomFilterDemo() {
  const [mode, setMode] = useState<keyof typeof examples>("absent"); const sample = examples[mode];
  const checkedBits: readonly number[] = sample.bits;
  return <section className="sd-bloom-demo" aria-labelledby="bloom-demo-title"><header><span>Membership schematic</span><h2 id="bloom-demo-title">Check several hashed bit positions</h2></header><div className="sd-bloom-bits" role="img" aria-label={`Eight-bit Bloom filter query: ${sample.result}`}>{Array.from({ length: 8 }, (_, index) => <span key={index} data-checked={checkedBits.includes(index)} data-value={mode === "possible" || index !== 6 ? "1" : "0"}>{mode === "possible" || index !== 6 ? "1" : "0"}</span>)}</div><div className="sd-bloom-controls"><button type="button" aria-pressed={mode === "absent"} onClick={() => setMode("absent")}>Query absent item</button><button type="button" aria-pressed={mode === "possible"} onClick={() => setMode("possible")}>Query possible item</button></div><output aria-live="polite"><strong>{sample.result}</strong><span>{sample.detail}</span></output></section>;
}
