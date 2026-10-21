import type { Accent } from "@/lib/audiences";

/**
 * Tailwind classes per accent. Written out in full so Tailwind can find them.
 * Hero tints are defined in app/globals.css (`--hero-<accent>`).
 */
export const ACCENT_CLASSES: Record<Accent, { dot: string; hero: string }> = {
  violet: { dot: "bg-brand", hero: "bg-hero-violet" },
  blue: { dot: "bg-accent-blue", hero: "bg-hero-blue" },
  teal: { dot: "bg-accent-teal", hero: "bg-hero-teal" },
  pink: { dot: "bg-accent-pink", hero: "bg-hero-pink" },
  gold: { dot: "bg-accent-gold", hero: "bg-hero-gold" },
};
