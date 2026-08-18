"use client";

import { Search } from "lucide-react";
import { globalSearchOpenEvent } from "./global-search";

export function SearchLauncher({
  className,
  label = "Search",
  showShortcut = false,
}: {
  className: string;
  label?: string;
  showShortcut?: boolean;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(globalSearchOpenEvent))}
      aria-label="Search Engineering Foundry"
    >
      <Search size={18} aria-hidden="true" />
      <span className="search-label">{label}</span>
      {showShortcut && <kbd aria-hidden="true">Ctrl/⌘ K</kbd>}
    </button>
  );
}
