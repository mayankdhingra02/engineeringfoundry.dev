"use client";

import { Search } from "lucide-react";
import { requestGlobalSearch } from "./global-search";

export function SearchLauncher({
  className,
  label = "Search",
  showShortcut = false,
  fallbackFocusId,
}: {
  className: string;
  label?: string;
  showShortcut?: boolean;
  fallbackFocusId?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => requestGlobalSearch({ invoker: event.currentTarget, fallbackFocusId })}
      aria-label="Search Engineering Foundry"
    >
      <Search size={18} aria-hidden="true" />
      <span className="search-label">{label}</span>
      {showShortcut && <kbd aria-hidden="true">Ctrl/⌘ K</kbd>}
    </button>
  );
}
