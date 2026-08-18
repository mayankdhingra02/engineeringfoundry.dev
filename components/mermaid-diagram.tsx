"use client";

import { useEffect, useId, useRef, useState } from "react";

export function MermaidDiagram({ chart, title, description }: { chart: string; title: string; description: string }) {
  const reactId = useId();
  const host = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const observer = new MutationObserver(render);
    async function render() {
      try {
        const { default: mermaid } = await import("mermaid");
        const dark = document.documentElement.classList.contains("dark");
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: dark ? "dark" : "neutral", fontFamily: "inherit" });
        const id = `sd-mermaid-${reactId.replace(/[^a-zA-Z0-9]/g, "")}-${dark ? "dark" : "light"}`;
        const { svg, bindFunctions } = await mermaid.render(id, chart);
        if (cancelled || !host.current) return;
        host.current.innerHTML = svg;
        host.current.querySelector("svg")?.setAttribute("aria-hidden", "true");
        bindFunctions?.(host.current);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    }
    void render();
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => { cancelled = true; observer.disconnect(); };
  }, [chart, reactId]);

  return <figure className="sd-mermaid" aria-labelledby={`${reactId}-title`} aria-describedby={`${reactId}-description`}>
    <strong id={`${reactId}-title`}>{title}</strong>
    <div ref={host} className="sd-mermaid-canvas" role="img" aria-label={description}>
      {error && <pre><code>{chart}</code></pre>}
    </div>
    <figcaption id={`${reactId}-description`}>{description}</figcaption>
  </figure>;
}
