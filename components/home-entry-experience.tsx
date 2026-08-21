"use client";

import Link from "next/link";
import { ArrowRight, Binary, Building2, MessagesSquare, Network } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { systemDesignProgressEvent, systemDesignProgressStorageKey } from "./system-design-lesson-progress";
import {
  migrateLegacySystemDesignProgress,
  preparationActivityDaysThisWeek,
  removeLocalProgressItems,
  parseLocalPreparationProgress,
  preparationProgressEvent,
  readLocalPreparationProgress,
  writeLocalPreparationProgress,
} from "@/lib/preparation-progress/local";
import {
  choosePreparationContinuation,
  localContinuationCandidates,
  type ContinuationCatalog,
  type PreparationContinuation,
} from "@/lib/preparation-progress/continuation";

const tracks = [
  { title: "DSA", bestFor: "Best for coding rounds", description: "Learn patterns, build a roadmap, and practice company-tagged questions.", href: "/dsa", action: "Open DSA", icon: Binary },
  { title: "System Design", bestFor: "Best for architecture rounds", description: "Learn core concepts, focus your plan, and practice 50+ designs.", href: "/system-design/start-here/introduction", action: "Start learning", icon: Network },
  { title: "Companies", bestFor: "Best when one employer is the target", description: "Understand its interview process and prepare each round in context.", href: "/companies", action: "Choose a company", icon: Building2 },
  { title: "Behavioral", bestFor: "Best for story-based rounds", description: "Shape evidence around impact, judgment, leadership, and growth.", href: "/behavioral", action: "Prepare stories", icon: MessagesSquare },
] as const;

function readBrowserProgressWithLegacy() {
  const current = readLocalPreparationProgress(window.localStorage);
  const legacy = JSON.parse(window.localStorage.getItem(systemDesignProgressStorageKey) ?? "{}");
  return {
    legacy,
    progress: parseLocalPreparationProgress({
      ...current,
      items: [...current.items, ...migrateLegacySystemDesignProgress(legacy)],
    }),
  };
}

export function HomeEntryExperience({ continuationCatalog }: { continuationCatalog: ContinuationCatalog }) {
  const [localCandidates, setLocalCandidates] = useState<PreparationContinuation[]>([]);
  const [accountCandidates, setAccountCandidates] = useState<PreparationContinuation[]>([]);
  const [localWeeklyActivityDays, setLocalWeeklyActivityDays] = useState(0);
  const [accountWeeklyActivityDays, setAccountWeeklyActivityDays] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [accountChecked, setAccountChecked] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [progressChecked, setProgressChecked] = useState(false);

  const readProgress = useCallback(() => {
    try {
      const { progress } = readBrowserProgressWithLegacy();
      setLocalCandidates(localContinuationCandidates(progress, continuationCatalog));
      setLocalWeeklyActivityDays(preparationActivityDaysThisWeek(progress.items));
    } catch {
      setLocalCandidates([]);
    }
    setProgressChecked(true);
  }, [continuationCatalog]);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(readProgress);
    window.addEventListener("storage", readProgress);
    window.addEventListener(systemDesignProgressEvent, readProgress);
    window.addEventListener(preparationProgressEvent, readProgress);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("storage", readProgress);
      window.removeEventListener(systemDesignProgressEvent, readProgress);
      window.removeEventListener(preparationProgressEvent, readProgress);
    };
  }, [readProgress]);

  useEffect(() => {
    let active = true;
    void fetch("/api/preparation/continuation", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ authenticated?: boolean; candidates?: PreparationContinuation[]; weeklyActivityDays?: number }> : { authenticated: false, candidates: [], weeklyActivityDays: 0 })
      .then((data) => { if (active) { setAuthenticated(Boolean(data.authenticated)); setAccountCandidates(data.candidates ?? []); setAccountWeeklyActivityDays(data.weeklyActivityDays ?? 0); setAccountChecked(true); } })
      .catch(() => { if (active) setAccountChecked(true); });
    return () => { active = false; };
  }, []);

  async function importBrowserActivity() {
    setImporting(true);
    setImportMessage(null);
    try {
      const { progress, legacy } = readBrowserProgressWithLegacy();
      const response = await fetch("/api/preparation/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(progress) });
      const result = await response.json() as { imported?: string[]; skipped?: string[]; plansRequireChoice?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Browser activity could not be imported.");
      if (result.imported?.length) {
        writeLocalPreparationProgress(window.localStorage, removeLocalProgressItems(progress, result.imported));
        const importedSystemIds = new Set(result.imported.filter((key) => key.startsWith("system-design:")).map((key) => key.slice("system-design:".length)));
        if (importedSystemIds.size && legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
          const remainingLegacy = Object.fromEntries(Object.entries(legacy as Record<string, unknown>).filter(([key]) => importedSystemIds.has(key.slice(key.indexOf(":") + 1)) === false));
          window.localStorage.setItem(systemDesignProgressStorageKey, JSON.stringify(remainingLegacy));
        }
        window.dispatchEvent(new CustomEvent(preparationProgressEvent));
      }
      setImportMessage(`${result.imported?.length ?? 0} activities imported${result.skipped?.length ? `; ${result.skipped.length} existing account activities were left unchanged.` : "."}${result.plansRequireChoice ? " Saved plans remain in this browser until you choose one on its plan page." : ""}`);
      const fresh = await fetch("/api/preparation/continuation", { cache: "no-store" });
      if (fresh.ok) { const data = await fresh.json() as { authenticated?: boolean; candidates?: PreparationContinuation[]; weeklyActivityDays?: number }; setAuthenticated(Boolean(data.authenticated)); setAccountCandidates(data.candidates ?? []); setAccountWeeklyActivityDays(data.weeklyActivityDays ?? 0); }
    } catch (error) { setImportMessage(error instanceof Error ? error.message : "Browser activity could not be imported."); }
    finally { setImporting(false); }
  }

  const continuation = choosePreparationContinuation(accountCandidates, localCandidates);
  const weeklyActivityDays = accountWeeklyActivityDays || localWeeklyActivityDays;

  return (
    <div className={`home-entry-experience${continuation ? " is-returning" : ""}`}>
      {progressChecked && continuation && (
        <section className="home-continue" aria-labelledby="home-continue-title" aria-live="polite">
          <div>
            <span>Continue preparation</span>
            <h2 id="home-continue-title">{continuation.title}</h2>
            <p>{continuation.context}</p>
            {weeklyActivityDays > 0 && <small className="home-momentum">Preparation recorded on {weeklyActivityDays} {weeklyActivityDays === 1 ? "day" : "days"} this week.</small>}
          </div>
          <Link className="button" href={continuation.href}>Continue {continuation.track === "interview" ? "interview prep" : continuation.track === "dsa" ? "DSA" : continuation.track === "system-design" ? "System Design" : continuation.track === "ml-design" ? "ML Design" : "Behavioral"} <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      )}

      {accountChecked && authenticated && localCandidates.length > 0 && (
        <aside className="home-local-import" aria-live="polite">
          <div><strong>Browser activity found</strong><p>Import only activity that is not already in your account. Existing account progress is never overwritten.</p></div>
          <button type="button" className="button button-secondary" disabled={importing} onClick={() => { void importBrowserActivity(); }}>{importing ? "Importing…" : "Import activity"}</button>
          {importMessage && <small role="status">{importMessage}</small>}
        </aside>
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
