"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDark(document.documentElement.classList.contains("dark")));
    return () => cancelAnimationFrame(frame);
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("ef-theme", next ? "dark" : "light");
  }
  return (
    <button className="icon-button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
