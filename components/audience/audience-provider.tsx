"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_AUDIENCE, parseAudience, type Audience } from "@/lib/audiences";

const STORAGE_KEY = "portfolio:audience";

// A tiny external store over localStorage. Storage can throw (private mode,
// blocked site data), so every access is guarded and an in-memory value wins.
let memoryValue: Audience | null = null;
const listeners = new Set<() => void>();

function readStored(): Audience {
  if (memoryValue) return memoryValue;
  try {
    return parseAudience(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_AUDIENCE;
  } catch {
    return DEFAULT_AUDIENCE;
  }
}

function writeStored(audience: Audience) {
  memoryValue = audience;
  try {
    window.localStorage.setItem(STORAGE_KEY, audience);
  } catch {
    // Persisting is a convenience; the in-memory value still applies.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    memoryValue = parseAudience(event.newValue);
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

type AudienceContextValue = {
  audience: Audience;
  setAudience: (audience: Audience) => void;
};

const AudienceContext = createContext<AudienceContextValue | null>(null);

export function AudienceProvider({ children }: { children: ReactNode }) {
  const audience = useSyncExternalStore(subscribe, readStored, () => DEFAULT_AUDIENCE);
  return (
    <AudienceContext.Provider value={{ audience, setAudience: writeStored }}>
      {children}
    </AudienceContext.Provider>
  );
}

export function useAudience(): AudienceContextValue {
  const value = useContext(AudienceContext);
  if (!value) throw new Error("useAudience must be used inside <AudienceProvider>");
  return value;
}
