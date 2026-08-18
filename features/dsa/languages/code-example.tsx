"use client";

import { Check, Clipboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function CodeExample({
  language,
  title,
  code,
  note,
}: {
  language: "python" | "java";
  title: string;
  code: string;
  note?: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <figure className="dsa-language-code">
      <figcaption>
        <div>
          <span>{title}</span>
          <small>{language}</small>
        </div>
        <button
          type="button"
          onClick={copyCode}
          aria-label={`Copy ${title} ${language} code`}
        >
          {copyState === "copied" ? <Check size={13} /> : <Clipboard size={13} />}
          {copyState === "copied" ? "Copied" : "Copy"}
        </button>
      </figcaption>
      <pre role="region" aria-label={`${title}, ${language} code`}>
        <code>{code}</code>
      </pre>
      {note && <p>{note}</p>}
      <span className="sr-only" role="status" aria-live="polite">
        {copyState === "copied"
          ? `${title} copied.`
          : copyState === "failed"
            ? `Could not copy ${title}. Select the code and copy it manually.`
            : ""}
      </span>
    </figure>
  );
}
