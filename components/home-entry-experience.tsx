"use client";

import Link from "next/link";
import { ArrowRight, Binary, Building2, MessagesSquare, Network } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  getSystemDesignContinuation,
  type HomeContinuation,
  type HomeSystemDesignLesson,
} from "@/lib/home-continuation";
import { systemDesignProgressEvent, systemDesignProgressStorageKey } from "./system-design-lesson-progress";

export type { HomeSystemDesignLesson } from "@/lib/home-continuation";

const tracks = [
  { title: "DSA", bestFor: "Best for coding rounds", description: "Learn patterns, build a roadmap, and practice company-tagged questions.", href: "/dsa", action: "Open DSA", icon: Binary },
  { title: "System Design", bestFor: "Best for architecture rounds", description: "Learn core concepts, focus your plan, and practice 50+ designs.", href: "/system-design/start-here/introduction", action: "Start learning", icon: Network },
  { title: "Companies", bestFor: "Best when one employer is the target", description: "Understand its interview process and prepare each round in context.", href: "/companies", action: "Choose a company", icon: Building2 },
  { title: "Behavioral", bestFor: "Best for story-based rounds", description: "Shape evidence around impact, judgment, leadership, and growth.", href: "/behavioral", action: "Prepare stories", icon: MessagesSquare },
] as const;

export function HomeEntryExperience({ lessons }: { lessons: readonly HomeSystemDesignLesson[] }) {
  const [continuation, setContinuation] = useState<HomeContinuation | null>(null);
  const [progressChecked, setProgressChecked] = useState(false);

  const readProgress = useCallback(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(systemDesignProgressStorageKey) ?? "{}");
      setContinuation(getSystemDesignContinuation(stored, lessons));
    } catch {
      setContinuation(null);
    }
    setProgressChecked(true);
  }, [lessons]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(readProgress);
    window.addEventListener("storage", readProgress);
    window.addEventListener(systemDesignProgressEvent, readProgress);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("storage", readProgress);
      window.removeEventListener(systemDesignProgressEvent, readProgress);
    };
  }, [readProgress]);

  return (
    <div className={`home-entry-experience${continuation ? " is-returning" : ""}`}>
      {progressChecked && continuation && (
        <section className="home-continue" aria-labelledby="home-continue-title" aria-live="polite">
          <div>
            <span>Continue preparation</span>
            <h2 id="home-continue-title">{continuation.title}</h2>
            <p>{continuation.context}</p>
          </div>
          <Link className="button" href={continuation.href}>Continue System Design <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      )}

      <div className="home-track-heading">
        <div>
          <h2>{continuation ? "Choose another track" : "Choose a track"}</h2>
          <p>Everything is public. You can switch tracks whenever your interview plan changes.</p>
        </div>
        <Link className="home-help-link" href="/prepare">Not sure where to start? <span>Compare tracks</span></Link>
      </div>
      <nav className="home-track-grid" aria-label="Interview preparation tracks">
        {tracks.map(({ icon: Icon, ...track }) => (
          <Link className="home-track-link" href={track.href} key={track.href}>
            <span className="home-track-icon"><Icon size={21} aria-hidden="true" /></span>
            <span className="home-track-copy"><strong>{track.title}</strong><span className="home-track-fit">{track.bestFor}</span><small>{track.description}</small></span>
            <span className="home-track-action">{track.action} <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
