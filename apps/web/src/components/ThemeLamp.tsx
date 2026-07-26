"use client";

import { useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

type Choice = "light" | "dark" | "system";
const KEY = "pf-theme";

// Module-level emitter: the lamp renders in both the sidebar and the
// mobile bar, and every instance must reflect a pick immediately.
const listeners = new Set<() => void>();

const OPTIONS: Array<{ choice: Choice; label: string }> = [
  { choice: "light", label: "Light" },
  { choice: "dark", label: "Dark" },
  { choice: "system", label: "System" },
];

function read(): Choice {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

export function ThemeLamp({ className }: { className?: string }) {
  const subscribe = useCallback((cb: () => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, []);
  const choice = useSyncExternalStore<Choice>(subscribe, read, () => "system");

  function pick(next: Choice) {
    try {
      if (next === "system") window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, next);
    } catch {
      /* storage unavailable: applies for this page view */
    }
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", next);
    listeners.forEach((cb) => cb());
  }

  return (
    <div className={cn("flex items-center", className)} role="group" aria-label="Theme">
      {OPTIONS.map(({ choice: value, label }) => (
        <button
          key={value}
          type="button"
          aria-pressed={choice === value}
          onClick={() => pick(value)}
          className={cn(
            "px-2 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors",
            choice === value ? "font-medium text-spruce" : "text-ink-faint hover:text-ink-soft"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
