"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Mode = "quick" | "full";

const OPTIONS: { mode: Mode; label: string }[] = [
  { mode: "quick", label: "30-second version" },
  { mode: "full", label: "Full story" },
];

/** Switch between the 30-second summary and the full write-up. */
export function StoryToggle({ quick, full }: { quick: ReactNode; full: ReactNode }) {
  const [mode, setMode] = useState<Mode>("quick");

  return (
    <div>
      <div
        role="group"
        aria-label="Story length"
        className="inline-flex rounded-lg border border-line-subtle bg-sunken p-1"
      >
        {OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            aria-pressed={mode === option.mode}
            onClick={() => setMode(option.mode)}
            className={cn(
              "min-h-11 rounded-md px-3 text-sm font-medium transition-colors sm:px-4",
              mode === option.mode
                ? "bg-surface text-primary shadow-sm"
                : "text-secondary hover:text-primary",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-6" data-testid={`story-${mode}`}>
        {mode === "quick" ? quick : full}
      </div>
    </div>
  );
}
