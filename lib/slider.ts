/**
 * Pure maths for the audience slider: thumb progress (0..1) <-> stop index.
 * Kept free of React so it can be unit tested directly.
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Progress (0..1) of stop `index` on a track with `stopCount` evenly spaced stops. */
export function indexToProgress(index: number, stopCount: number): number {
  if (stopCount <= 1) return 0;
  return clamp(index, 0, stopCount - 1) / (stopCount - 1);
}

/** Nearest stop index for a progress value. Out-of-range input is clamped. */
export function progressToIndex(progress: number, stopCount: number): number {
  if (stopCount <= 1 || Number.isNaN(progress)) return 0;
  return Math.round(clamp(progress, 0, 1) * (stopCount - 1));
}

/**
 * The two adjacent stops around `progress`, and how far (0..1) it is from `lower` to `upper`.
 * Drives the hero wipe: each stop-to-stop move is one full-width sweep.
 */
export function segmentAt(
  progress: number,
  stopCount: number,
): { lower: number; upper: number; fraction: number } {
  if (stopCount <= 1 || Number.isNaN(progress)) return { lower: 0, upper: 0, fraction: 0 };
  const scaled = clamp(progress, 0, 1) * (stopCount - 1);
  const lower = Math.min(Math.floor(scaled), stopCount - 2);
  return { lower, upper: lower + 1, fraction: scaled - lower };
}

/** Progress (0..1) of a pointer x position over a track rectangle. */
export function pointerToProgress(clientX: number, trackLeft: number, trackWidth: number): number {
  if (trackWidth <= 0) return 0;
  return clamp((clientX - trackLeft) / trackWidth, 0, 1);
}

/** Next stop index for a keyboard key, or null if the key isn't handled. */
export function indexForKey(key: string, current: number, stopCount: number): number | null {
  const last = stopCount - 1;
  switch (key) {
    case "ArrowRight":
    case "ArrowUp":
      return Math.min(last, current + 1);
    case "ArrowLeft":
    case "ArrowDown":
      return Math.max(0, current - 1);
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return null;
  }
}
