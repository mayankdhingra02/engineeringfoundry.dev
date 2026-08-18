"use client";

import { RotateCcw, ShieldCheck, Zap } from "lucide-react";
import { useState } from "react";

const concurrentRequests = 10_000;

export function CacheStampedeDemo() {
  const [expired, setExpired] = useState(false);
  const [coalescing, setCoalescing] = useState(false);

  const databaseRequests = expired ? (coalescing ? 1 : concurrentRequests) : 0;
  const waitingRequests = expired && coalescing ? concurrentRequests - 1 : 0;
  const state = !expired ? "The hot key is cached; all 10,000 requests are served without a database read." : coalescing ? "One request refreshes the key while 9,999 requests wait for the shared result." : "The expired key turns 10,000 concurrent reads into 10,000 database queries.";

  return <section className="sd-stampede-demo" aria-labelledby="stampede-demo-title">
    <header><span>Interactive failure model</span><h3 id="stampede-demo-title">One expired key, two very different outcomes</h3><p>Expire a hot key, then enable request coalescing to compare origin load.</p></header>
    <div className="sd-stampede-path" aria-hidden="true">
      <div><strong>10,000</strong><small>concurrent reads</small></div><i>→</i><div className={expired ? "is-miss" : "is-hit"}><strong>{expired ? "MISS" : "HIT"}</strong><small>popular:profile</small></div><i>→</i><div className={databaseRequests > 1 ? "is-danger" : ""}><strong>{databaseRequests.toLocaleString()}</strong><small>database queries</small></div>
    </div>
    <div className="sd-stampede-controls">
      <button type="button" aria-pressed={expired} onClick={() => setExpired(true)}><Zap size={14} />Expire hot key</button>
      <button type="button" aria-pressed={coalescing} disabled={!expired} onClick={() => setCoalescing((value) => !value)}><ShieldCheck size={14} />{coalescing ? "Disable" : "Enable"} coalescing</button>
      <button type="button" onClick={() => { setExpired(false); setCoalescing(false); }}><RotateCcw size={14} />Reset</button>
    </div>
    <output aria-live="polite"><strong>{databaseRequests.toLocaleString()} DB {databaseRequests === 1 ? "query" : "queries"}</strong><span>{waitingRequests ? `${waitingRequests.toLocaleString()} requests wait for the same refresh. ` : ""}{state}</span></output>
    <details><summary>Accessible request-state summary</summary><div><table><thead><tr><th>Cache state</th><th>Coordination</th><th>DB queries</th></tr></thead><tbody><tr><td>Fresh</td><td>Not needed</td><td>0</td></tr><tr><td>Expired</td><td>None</td><td>10,000</td></tr><tr><td>Expired</td><td>Single flight</td><td>1</td></tr></tbody></table></div></details>
  </section>;
}
