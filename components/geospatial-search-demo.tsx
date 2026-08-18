"use client";

import { useState } from "react";

const drivers = [{ cell: 0, label: "D1" }, { cell: 2, label: "D2" }, { cell: 3, label: "D3" }, { cell: 4, label: "D4" }, { cell: 7, label: "D5" }, { cell: 8, label: "D6" }];

export function GeospatialSearchDemo() {
  const [neighbors, setNeighbors] = useState(true);
  const candidates = drivers.filter((driver) => neighbors || driver.cell === 4);
  return <section className="sd-geo-demo" aria-labelledby="geo-demo-title"><header><span>Conceptual spatial visual</span><h2 id="geo-demo-title">Expand from the user&apos;s cell</h2><p>This schematic is not a real map. It shows candidate reduction before exact distance filtering.</p></header><div className="sd-geo-grid" role="img" aria-label={`A three by three conceptual grid with a user in the center and ${candidates.length} candidate drivers`} >{Array.from({ length: 9 }, (_, cell) => { const driver = candidates.find((item) => item.cell === cell); return <div key={cell} data-center={cell === 4} data-neighbor={neighbors && cell !== 4}>{cell === 4 && <strong>User</strong>}{driver && <span>{driver.label}</span>}</div>; })}<i aria-hidden="true" /></div><div className="sd-geo-controls"><button type="button" aria-pressed={!neighbors} onClick={() => setNeighbors(false)}>Current cell only</button><button type="button" aria-pressed={neighbors} onClick={() => setNeighbors(true)}>Include neighbors</button></div><output aria-live="polite"><strong>{candidates.length} spatial candidates</strong><span>Next: calculate precise distance and keep only matches inside the requested radius.</span></output></section>;
}
