"use client";

import { useState } from "react";

export function ConfirmAction({ action, label, confirmLabel = "Confirm delete" }: { action: () => Promise<void>; label: string; confirmLabel?: string }) {
  const [confirming, setConfirming] = useState(false);
  if (!confirming) return <button className="tracker-danger-link" type="button" onClick={() => setConfirming(true)}>{label}</button>;
  return <div className="tracker-confirm" role="group" aria-label={`${label} confirmation`}><span>Are you sure?</span><form action={action}><button className="button button-danger button-sm" type="submit">{confirmLabel}</button></form><button className="button button-secondary button-sm" type="button" onClick={() => setConfirming(false)}>Cancel</button></div>;
}

