"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDark(document.documentElement.classList.contains("dark")));
    function syncTheme(event: Event) { setDark((event as CustomEvent<{ dark: boolean }>).detail.dark); }
    window.addEventListener("ef-theme-change", syncTheme);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("ef-theme-change", syncTheme); };
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ef-theme", next ? "dark" : "light");
    window.dispatchEvent(new CustomEvent("ef-theme-change", { detail: { dark: next } }));
  }
  return (
    <button className={showLabel ? "mobile-theme-toggle" : "icon-button"} onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
      {showLabel && <span>Use {dark ? "light" : "dark"} theme</span>}
    </button>
  );
}
