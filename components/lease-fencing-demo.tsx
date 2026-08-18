"use client";

import { useState } from "react";

const steps = [
  { title: "A acquires lease", detail: "Worker A receives fencing token 41." },
  { title: "A pauses", detail: "A stops making progress during a long process or network pause." },
  { title: "Lease expires", detail: "The lock service can grant ownership again." },
  { title: "B acquires", detail: "Worker B receives newer token 42." },
  { title: "A resumes", detail: "A still has stale local belief that it may write." },
  { title: "Stale write rejected", detail: "The protected store has seen 42, so it rejects token 41." },
] as const;

export function LeaseFencingDemo() {
  const [step, setStep] = useState(0);
  return <section className="sd-fencing-demo" aria-labelledby="fencing-demo-title"><header><span>Interactive failure timeline</span><h2 id="fencing-demo-title">Pause a lock owner beyond its lease</h2><p>Advance the scenario to see why expiration alone cannot stop a stale process from acting.</p></header><ol>{steps.map((item, index) => <li key={item.title} data-active={index === step} data-complete={index < step}><button type="button" onClick={() => setStep(index)} aria-current={index === step ? "step" : undefined}><span>{index + 1}</span><strong>{item.title}</strong></button></li>)}</ol><div className="sd-fencing-state" aria-live="polite"><strong>{steps[step].title}</strong><p>{steps[step].detail}</p><code>{step < 3 ? "accepted token: 41" : "accepted token: 42"}</code></div><div className="sd-fencing-actions"><button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>Previous</button><button type="button" onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))} disabled={step === steps.length - 1}>Next event</button></div></section>;
}
