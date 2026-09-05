"use client";

import { Pause, Play, RotateCcw, Send } from "lucide-react";
import { useState } from "react";

export function FanOutDemo() {
  const [published, setPublished] = useState(0);
  const [notificationsPaused, setNotificationsPaused] = useState(false);
  const notificationDelivered = notificationsPaused ? 0 : published;
  const backlog = published - notificationDelivered;

  return <section className="sd-fanout-demo" aria-labelledby="fanout-demo-title">
    <header><span>Interactive delivery model</span><h3 id="fanout-demo-title">One event, three independent obligations</h3><p>Pause one branch, then publish events. Healthy subscribers keep moving while the paused subscription builds its own backlog.</p></header>
    <div className="sd-fanout-branches" aria-hidden="true">
      <div><strong>Search</strong><span>{published} delivered</span></div>
      <div className={notificationsPaused ? "is-paused" : ""}><strong>Notifications</strong><span>{notificationDelivered} delivered · {backlog} queued</span></div>
      <div><strong>Analytics</strong><span>{published} delivered</span></div>
    </div>
    <div className="sd-fanout-controls">
      <button type="button" onClick={() => setPublished((value) => value + 1)}><Send size={14} />Publish event</button>
      <button type="button" aria-pressed={notificationsPaused} onClick={() => setNotificationsPaused((value) => !value)}>{notificationsPaused ? <Play size={14} /> : <Pause size={14} />}{notificationsPaused ? "Resume" : "Pause"} notifications</button>
      <button type="button" onClick={() => { setPublished(0); setNotificationsPaused(false); }}><RotateCcw size={14} />Reset</button>
    </div>
    <output aria-live="polite" aria-atomic="true"><strong>{published} {published === 1 ? "event" : "events"} published · {backlog} queued</strong><span>{notificationsPaused ? "Search and analytics continue; the notification subscription retains its own recovery work." : "All three subscriptions are current."}</span></output>
    <details><summary>Accessible subscriber-state summary</summary><div><table><thead><tr><th>Subscription</th><th>Delivered</th><th>Backlog</th></tr></thead><tbody><tr><td>Search</td><td>{published}</td><td>0</td></tr><tr><td>Notifications</td><td>{notificationDelivered}</td><td>{backlog}</td></tr><tr><td>Analytics</td><td>{published}</td><td>0</td></tr></tbody></table></div></details>
  </section>;
}
