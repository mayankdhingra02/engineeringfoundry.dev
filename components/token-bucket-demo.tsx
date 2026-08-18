"use client";

import { Pause, Play, RotateCcw, Send } from "lucide-react";
import { useEffect, useState } from "react";

const capacity = 10;
const refillPerSecond = 5;

export function TokenBucketDemo() {
  const [bucket, setBucket] = useState({ tokens: capacity, accepted: 0, rejected: 0 });
  const [refilling, setRefilling] = useState(true);
  const { tokens, accepted, rejected } = bucket;

  useEffect(() => {
    if (!refilling) return;
    const interval = window.setInterval(() => setBucket((current) => ({ ...current, tokens: Math.min(capacity, current.tokens + refillPerSecond) })), 1000);
    return () => window.clearInterval(interval);
  }, [refilling]);

  function send(count: number) {
    setBucket((current) => {
      const admitted = Math.min(current.tokens, count);
      return {
        tokens: current.tokens - admitted,
        accepted: current.accepted + admitted,
        rejected: current.rejected + count - admitted,
      };
    });
  }

  function reset() { setBucket({ tokens: capacity, accepted: 0, rejected: 0 }); setRefilling(true); }

  return <section className="sd-token-bucket" aria-labelledby="token-bucket-title">
    <header><span>Interactive model</span><h3 id="token-bucket-title">Token bucket: 10-token burst, 5-token/sec refill</h3><p>Each request needs one token. Pause refill or send a burst to see when requests are rejected.</p></header>
    <div className="sd-token-bucket-visual">
      <div className="sd-token-track" role="meter" aria-label="Current tokens" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={tokens}><span style={{ width: `${tokens / capacity * 100}%` }} /></div>
      <strong>{tokens} / {capacity} tokens</strong>
    </div>
    <div className="sd-token-controls">
      <button type="button" onClick={() => send(1)}><Send size={14} />Send 1 request</button>
      <button type="button" onClick={() => send(8)}><Send size={14} />Send burst of 8</button>
      <button type="button" aria-pressed={!refilling} onClick={() => setRefilling((value) => !value)}>{refilling ? <Pause size={14} /> : <Play size={14} />}{refilling ? "Pause refill" : "Resume refill"}</button>
      <button type="button" onClick={reset}><RotateCcw size={14} />Reset</button>
    </div>
    <output className="sd-token-results" aria-live="polite"><span><strong>{accepted}</strong>accepted</span><span><strong>{rejected}</strong>rejected</span><span><strong>{refilling ? `${refillPerSecond}/sec` : "paused"}</strong>refill</span></output>
  </section>;
}
