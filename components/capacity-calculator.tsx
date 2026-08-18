"use client";

import { useMemo, useState } from "react";

function compact(value: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function CapacityCalculator() {
  const [users, setUsers] = useState(100_000_000);
  const [requests, setRequests] = useState(10);
  const [peak, setPeak] = useState(5);
  const result = useMemo(() => {
    const daily = Math.max(0, users) * Math.max(0, requests);
    const average = daily / 86_400;
    return { daily, average, peak: average * Math.max(0, peak) };
  }, [peak, requests, users]);

  return <section className="sd-calculator" aria-labelledby="capacity-calculator-title">
    <header><span>Try the assumptions</span><h3 id="capacity-calculator-title">Traffic estimator</h3><p>Approximate interview math. Change the inputs, then ask whether the result changes the architecture.</p></header>
    <div className="sd-calculator-inputs">
      <label>Daily active users<input type="number" min="0" step="1000000" value={users} onChange={(event) => setUsers(event.currentTarget.valueAsNumber || 0)} /></label>
      <label>Requests per user/day<input type="number" min="0" step="1" value={requests} onChange={(event) => setRequests(event.currentTarget.valueAsNumber || 0)} /></label>
      <label>Peak multiplier<input type="number" min="0" step="0.5" value={peak} onChange={(event) => setPeak(event.currentTarget.valueAsNumber || 0)} /></label>
    </div>
    <output className="sd-calculator-results" aria-live="polite">
      <span><strong>{compact(result.daily)}</strong>requests/day</span>
      <span><strong>~{compact(result.average)}</strong>average RPS</span>
      <span><strong>~{compact(result.peak)}</strong>peak RPS</span>
    </output>
  </section>;
}
