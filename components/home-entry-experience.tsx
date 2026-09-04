"use client";

import Link from "next/link";
import { ArrowRight, Binary, BookOpenCheck, BrainCircuit, Building2, MessagesSquare, Network, Puzzle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { homeCoreTracks, homeSupportingTracks } from "@/lib/home-track-catalog";
import { systemDesignProgressEvent, systemDesignProgressStorageKey } from "./system-design-lesson-progress";
import {
  migrateLegacySystemDesignProgress,
  preparationActivityDaysThisWeek,
  parseLocalPreparationProgress,
  preparationProgressEvent,
  readLocalPreparationProgress,
  writeLocalPreparationProgress,
} from "@/lib/preparation-progress/local";
import {
  parsePreparationImportError,
  parsePreparationImportRequest,
  parsePreparationImportResponse,
  preparationImportStatusMessage,
  PREPARATION_IMPORT_INVALID_MESSAGE,
  PREPARATION_IMPORT_UNAVAILABLE_MESSAGE,
  reconcilePreparationImport,
} from "@/lib/preparation-progress/import";
import {
  createUnavailableAccountPreparationContinuationState,
  choosePreparationContinuation,
  localContinuationCandidates,
  normalizeAccountPreparationContinuationResponse,
  type AccountPreparationContinuationState,
  type ContinuationCatalog,
  type PreparationContinuation,
} from "@/lib/preparation-progress/continuation";

const trackIcons = {
  dsa: Binary,
  "system-design": Network,
  "ml-design": BrainCircuit,
  behavioral: MessagesSquare,
  "low-level-design": Puzzle,
  companies: Building2,
  "interview-execution": BookOpenCheck,
} as const;

function readBrowserProgressWithLegacy() {
  const current = readLocalPreparationProgress(window.localStorage);
  let legacy: unknown = null;
  try {
    legacy = JSON.parse(window.localStorage.getItem(systemDesignProgressStorageKey) ?? "{}");
  } catch {
    // Malformed legacy storage remains untouched and is not submitted.
  }
  return {
    current,
    legacy,
    progress: parseLocalPreparationProgress({
      ...current,
      items: [...current.items, ...migrateLegacySystemDesignProgress(legacy)],
    }),
  };
}

export function HomeEntryExperience({ continuationCatalog }: { continuationCatalog: ContinuationCatalog }) {
  const [localCandidates, setLocalCandidates] = useState<PreparationContinuation[]>([]);
  const [localImportableActivityCount, setLocalImportableActivityCount] = useState(0);
  const [localWeeklyActivityDays, setLocalWeeklyActivityDays] = useState(0);
  const [accountState, setAccountState] = useState<AccountPreparationContinuationState | null>(null);
  const [accountRequestPending, setAccountRequestPending] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [progressChecked, setProgressChecked] = useState(false);
  const presentedContinuations = useRef(new Set<string>());
  const mountedRef = useRef(false);
  const accountRequestIdRef = useRef(0);
  const accountRequestPendingRef = useRef(false);
  const importRequestIdRef = useRef(0);
  const importPendingRef = useRef(false);
  const importButtonRef = useRef<HTMLButtonElement>(null);
  const importStatusRef = useRef<HTMLElement>(null);
  const recoverImportFocusRef = useRef(false);
  const importFocusFrameRef = useRef<number | null>(null);
  const retryButtonRef = useRef<HTMLButtonElement>(null);
  const recoverFocusAfterRetryRef = useRef(false);
  const focusFrameRef = useRef<number | null>(null);
  const continuationHeadingRef = useRef<HTMLHeadingElement>(null);
  const trackHeadingRef = useRef<HTMLHeadingElement>(null);

  const readProgress = useCallback(() => {
    try {
      const { progress } = readBrowserProgressWithLegacy();
      setLocalCandidates(localContinuationCandidates(progress, continuationCatalog));
      setLocalImportableActivityCount(progress.items.length);
      setLocalWeeklyActivityDays(preparationActivityDaysThisWeek(progress.items));
    } catch {
      setLocalCandidates([]);
      setLocalImportableActivityCount(0);
    }
    setProgressChecked(true);
  }, [continuationCatalog]);

  const loadAccountProgress = useCallback(async (requestedByRetry = false) => {
    if (!mountedRef.current || accountRequestPendingRef.current) return;
    accountRequestPendingRef.current = true;
    recoverFocusAfterRetryRef.current = false;
    const requestId = ++accountRequestIdRef.current;
    setAccountRequestPending(true);

    try {
      const response = await fetch("/api/preparation/continuation", { cache: "no-store" });
      const payload: unknown = await response.json().catch(() => null);
      const parsed = normalizeAccountPreparationContinuationResponse(payload);
      const nextState = response.ok && parsed
        ? parsed
        : createUnavailableAccountPreparationContinuationState();
      if (!mountedRef.current || requestId !== accountRequestIdRef.current) return;
      recoverFocusAfterRetryRef.current = requestedByRetry
        && nextState.status !== "unavailable"
        && document.activeElement === retryButtonRef.current;
      setAccountState(nextState);
    } catch {
      if (!mountedRef.current || requestId !== accountRequestIdRef.current) return;
      setAccountState(createUnavailableAccountPreparationContinuationState());
    } finally {
      if (mountedRef.current && requestId === accountRequestIdRef.current) {
        accountRequestPendingRef.current = false;
        setAccountRequestPending(false);
      }
    }
  }, []);

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
    mountedRef.current = true;
    const initialRequestFrame = window.requestAnimationFrame(() => { void loadAccountProgress(); });
    return () => {
      window.cancelAnimationFrame(initialRequestFrame);
      mountedRef.current = false;
      accountRequestIdRef.current += 1;
      accountRequestPendingRef.current = false;
      importRequestIdRef.current += 1;
      importPendingRef.current = false;
      if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
      if (importFocusFrameRef.current !== null) window.cancelAnimationFrame(importFocusFrameRef.current);
    };
  }, [loadAccountProgress]);

  async function importBrowserActivity() {
    if (!mountedRef.current || importPendingRef.current) return;
    importPendingRef.current = true;
    recoverImportFocusRef.current = false;
    const requestId = ++importRequestIdRef.current;
    setImporting(true);
    setImportMessage(null);
    try {
      const { progress } = readBrowserProgressWithLegacy();
      const submitted = parsePreparationImportRequest(progress);
      if (!submitted) throw new Error(PREPARATION_IMPORT_INVALID_MESSAGE);
      const response = await fetch("/api/preparation/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitted),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(parsePreparationImportError(payload) ?? PREPARATION_IMPORT_UNAVAILABLE_MESSAGE);
      const result = parsePreparationImportResponse(payload, submitted);
      if (!result) throw new Error(PREPARATION_IMPORT_UNAVAILABLE_MESSAGE);
      if (!mountedRef.current || requestId !== importRequestIdRef.current) return;

      const current = readBrowserProgressWithLegacy();
      const reconciliation = reconcilePreparationImport(submitted, result, current.current, current.legacy);
      let localReconciliationFailed = false;
      let localStateChanged = false;
      try {
        if (reconciliation.primaryChanged) {
          writeLocalPreparationProgress(window.localStorage, reconciliation.progress);
          localStateChanged = true;
        }
        if (reconciliation.legacyChanged && reconciliation.legacySystemDesignProgress) {
          window.localStorage.setItem(
            systemDesignProgressStorageKey,
            JSON.stringify(reconciliation.legacySystemDesignProgress),
          );
          localStateChanged = true;
        }
      } catch {
        localReconciliationFailed = true;
      }
      if (localStateChanged) {
        window.dispatchEvent(new CustomEvent(preparationProgressEvent));
        window.dispatchEvent(new CustomEvent(systemDesignProgressEvent));
      }
      recoverImportFocusRef.current = document.activeElement === importButtonRef.current;
      setImportMessage(preparationImportStatusMessage(result, {
        changedLocallyCount: reconciliation.changedLocallyCount,
        localReconciliationFailed,
      }));
      await loadAccountProgress();
    } catch (error) {
      if (!mountedRef.current || requestId !== importRequestIdRef.current) return;
      const safeMessage = error instanceof Error
        ? parsePreparationImportError({ error: error.message })
        : null;
      setImportMessage(safeMessage ?? PREPARATION_IMPORT_UNAVAILABLE_MESSAGE);
    } finally {
      if (mountedRef.current && requestId === importRequestIdRef.current) {
        importPendingRef.current = false;
        setImporting(false);
      }
    }
  }

  const accountCandidates = accountState?.status === "ready" ? accountState.candidates : [];
  const accountWeeklyActivityDays = accountState?.status === "ready" ? accountState.weeklyActivityDays : 0;
  const authenticated = accountState?.status === "ready";
  const importAvailable = accountState?.status === "ready" && localCandidates.length > 0
    && localImportableActivityCount > 0;
  const continuation = choosePreparationContinuation(accountCandidates, localCandidates);
  const weeklyActivityDays = accountWeeklyActivityDays || localWeeklyActivityDays;
  const continuationSource = continuation ? `${continuation.source}:${continuation.kind}` : null;

  useEffect(() => {
    if (!recoverFocusAfterRetryRef.current || accountState?.status === "unavailable") return;
    recoverFocusAfterRetryRef.current = false;
    focusFrameRef.current = window.requestAnimationFrame(() => {
      focusFrameRef.current = null;
      if (!mountedRef.current) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      (continuationHeadingRef.current ?? trackHeadingRef.current)?.focus();
    });
  }, [accountState?.status, continuation]);

  useEffect(() => {
    if (!recoverImportFocusRef.current || importing || !importMessage) return;
    recoverImportFocusRef.current = false;
    if (importButtonRef.current?.isConnected) return;
    importFocusFrameRef.current = window.requestAnimationFrame(() => {
      importFocusFrameRef.current = null;
      if (!mountedRef.current) return;
      if (importButtonRef.current?.isConnected) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      importStatusRef.current?.focus();
    });
    return () => {
      if (importFocusFrameRef.current !== null) window.cancelAnimationFrame(importFocusFrameRef.current);
      importFocusFrameRef.current = null;
    };
  }, [accountState?.status, importMessage, importing]);

  useEffect(() => {
    if (!accountState || accountState.status === "unavailable" || !progressChecked || !continuation || !continuationSource || presentedContinuations.current.has(continuationSource)) return;
    presentedContinuations.current.add(continuationSource);
    track("continuation_presented", { track: continuation.track, continuation_source: continuationSource, authenticated });
  }, [accountState, authenticated, continuation, continuationSource, progressChecked]);

  return (
    <div className={`home-entry-experience${continuation ? " is-returning" : ""}`}>
      {progressChecked && continuation && (
        <section className="home-continue" aria-labelledby="home-continue-title" aria-live="polite">
          <div>
            <span>Continue preparation</span>
            <h2 id="home-continue-title" ref={continuationHeadingRef} tabIndex={-1}>{continuation.title}</h2>
            <p>{continuation.context}</p>
            {weeklyActivityDays > 0 && <small className="home-momentum">Preparation recorded on {weeklyActivityDays} {weeklyActivityDays === 1 ? "day" : "days"} this week.</small>}
          </div>
          <Link className="button" href={continuation.href} onClick={() => { if (!accountState || accountState.status === "unavailable") return; track("continuation_selected", { track: continuation.track, continuation_source: continuationSource, authenticated }); if (continuation.kind === "active-plan") track("study_plan_resumed", { track: continuation.track, continuation_source: continuationSource, authenticated }); }}>Continue {continuation.track === "interview" ? "interview prep" : continuation.track === "dsa" ? "DSA" : continuation.track === "system-design" ? "System Design" : continuation.track === "ml-design" ? "ML Design" : "Behavioral"} <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      )}

      {accountState?.status === "unavailable" && (
        <aside className="home-local-import">
          <div id="home-account-progress-status" role="status" aria-live="polite" aria-atomic="true" aria-busy={accountRequestPending}>
            <strong>Account progress couldn’t load.</strong>
            <p>Public preparation remains available. Retry before relying on account-based continuation or weekly activity.</p>
          </div>
          <button
            ref={retryButtonRef}
            type="button"
            className="button button-secondary"
            aria-disabled={accountRequestPending}
            aria-describedby="home-account-progress-status"
            onClick={() => {
              if (accountRequestPendingRef.current) return;
              void loadAccountProgress(true);
            }}
          >
            {accountRequestPending ? "Retrying account progress…" : "Retry account progress"}
          </button>
        </aside>
      )}

      {((importAvailable || (accountState?.status === "ready" && importing)) || importMessage) && (
        <aside className="home-local-import">
          <div><strong>{localImportableActivityCount > 0 || importing ? "Browser activity found" : "Browser activity import result"}</strong><p>Import only activity that is not already in your account. Existing account progress is never overwritten.</p></div>
          {(importAvailable || (accountState?.status === "ready" && importing)) && (
            <button
              ref={importButtonRef}
              type="button"
              className="button button-secondary"
              aria-disabled={importing}
              aria-describedby="home-browser-import-status"
              onClick={() => {
                if (importPendingRef.current) return;
                void importBrowserActivity();
              }}
            >
              {importing ? "Importing browser activity…" : "Import activity"}
            </button>
          )}
          <small
            ref={importStatusRef}
            id="home-browser-import-status"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            aria-busy={importing}
            tabIndex={-1}
          >
            {importing ? "Importing browser activity. Browser activity will remain here until each account result is confirmed." : importMessage}
          </small>
        </aside>
      )}

      <div className="home-track-heading">
        <div>
          <h2 ref={trackHeadingRef} tabIndex={-1}>{continuation ? "Choose another track" : "Choose a track"}</h2>
          <p>Everything is public. You can switch tracks whenever your interview plan changes.</p>
        </div>
        <Link className="home-help-link" href="/prepare">Not sure where to start? <span>Compare tracks</span></Link>
      </div>
      <nav className="home-track-grid" aria-label="Interview preparation tracks">
        {homeCoreTracks.map((track) => {
          const Icon = trackIcons[track.id];
          return (
            <Link className="home-track-link" href={track.href} key={track.href}>
              <span className="home-track-icon"><Icon size={21} aria-hidden="true" /></span>
              <span className="home-track-copy"><strong>{track.title}</strong><span className="home-track-fit">{track.bestFor}</span><small>{track.description}</small></span>
              <span className="home-track-action">{track.action} <ArrowRight size={15} aria-hidden="true" /></span>
            </Link>
          );
        })}
      </nav>
      <section className="home-other-tracks" aria-labelledby="home-other-tracks-title">
        <div className="home-other-tracks-heading">
          <h3 id="home-other-tracks-title">More interview tracks</h3>
          <p>Go directly to a specialized design track or the round-execution guide.</p>
        </div>
        <nav className="home-other-track-list" aria-label="More interview preparation tracks">
          {homeSupportingTracks.map((track) => {
            const Icon = trackIcons[track.id];
            return (
              <Link href={track.href} key={track.href}>
                <span className="home-other-track-icon"><Icon size={18} aria-hidden="true" /></span>
                <span><strong>{track.title}</strong><small>{track.description}</small></span>
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </section>
    </div>
  );
}
