"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PreparationCountsStatus as PreparationCountsAvailability } from "@/lib/interview-preparation/preparation-counts";

const descriptionId = "preparation-counts-recovery-description";
const successStatusId = "preparation-counts-success-status";

export function PreparationCountsStatus({ status }: { status: PreparationCountsAvailability }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [retrySucceeded, setRetrySucceeded] = useState(false);
  const retryPendingRef = useRef(false);
  const retryAttemptedRef = useRef(false);
  const retryTriggerRef = useRef<HTMLButtonElement>(null);
  const retryTriggerOwnedFocusRef = useRef(false);
  const successStatusRef = useRef<HTMLDivElement>(null);
  const completionFrameRef = useRef<number | null>(null);
  const focusFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (pending) return;

    retryPendingRef.current = false;
    const explicitRetryCompleted = retryAttemptedRef.current;
    if (!explicitRetryCompleted && !(status === "unavailable" && retrySucceeded)) return;

    retryAttemptedRef.current = false;
    const succeeded = explicitRetryCompleted && status === "ready";
    if (!succeeded) retryTriggerOwnedFocusRef.current = false;

    completionFrameRef.current = window.requestAnimationFrame(() => {
      completionFrameRef.current = null;
      setRetrySucceeded(succeeded);
    });

    return () => {
      if (completionFrameRef.current !== null) {
        window.cancelAnimationFrame(completionFrameRef.current);
        completionFrameRef.current = null;
      }
    };
  }, [pending, retrySucceeded, status]);

  useEffect(() => {
    if (!retrySucceeded) return;

    const retryOwnedFocus = retryTriggerOwnedFocusRef.current;
    retryTriggerOwnedFocusRef.current = false;
    if (!retryOwnedFocus) return;

    focusFrameRef.current = window.requestAnimationFrame(() => {
      focusFrameRef.current = null;
      const activeElement = document.activeElement;
      if ((!activeElement || activeElement === document.body) && successStatusRef.current?.isConnected) {
        successStatusRef.current.focus();
      }
    });

    return () => {
      if (focusFrameRef.current !== null) {
        window.cancelAnimationFrame(focusFrameRef.current);
        focusFrameRef.current = null;
      }
    };
  }, [retrySucceeded]);

  function retry() {
    if (retryPendingRef.current) return;
    retryPendingRef.current = true;
    retryAttemptedRef.current = true;
    retryTriggerOwnedFocusRef.current = document.activeElement === retryTriggerRef.current;
    startTransition(() => router.refresh());
  }

  if (status === "ready") {
    return retrySucceeded ? (
      <div
        id={successStatusId}
        ref={successStatusRef}
        className="preparation-counts-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        tabIndex={-1}
      >
        <div>
          <strong>Preparation progress loaded.</strong>
          <p>Task counts are up to date.</p>
        </div>
      </div>
    ) : null;
  }

  return (
    <div
      className="preparation-counts-status"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-busy={pending}
    >
      <div>
        <strong>Preparation progress couldn’t load.</strong>
        <p id={descriptionId}>Your application and interview details remain available. Retry before relying on round task counts.</p>
      </div>
      <button
        ref={retryTriggerRef}
        type="button"
        className="button button-secondary"
        onClick={retry}
        aria-disabled={pending}
        aria-describedby={descriptionId}
      >
        {pending ? "Retrying preparation progress…" : "Retry preparation progress"}
      </button>
    </div>
  );
}
