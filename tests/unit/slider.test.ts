import { describe, expect, it } from "vitest";
import {
  indexForKey,
  indexToProgress,
  pointerToProgress,
  progressToIndex,
  segmentAt,
} from "@/lib/slider";

describe("progressToIndex", () => {
  it.each([
    [0, 0],
    [0.12, 0],
    [0.13, 1],
    [0.25, 1],
    [0.5, 2],
    [0.62, 2],
    [0.63, 3],
    [1, 4],
  ])("progress %d -> stop %d (5 stops)", (progress, index) => {
    expect(progressToIndex(progress, 5)).toBe(index);
  });

  it("clamps out-of-range and NaN input", () => {
    expect(progressToIndex(-0.5, 5)).toBe(0);
    expect(progressToIndex(1.7, 5)).toBe(4);
    expect(progressToIndex(Number.NaN, 5)).toBe(0);
  });

  it("round-trips with indexToProgress", () => {
    for (let i = 0; i < 5; i++) expect(progressToIndex(indexToProgress(i, 5), 5)).toBe(i);
  });
});

describe("indexToProgress", () => {
  it("spaces stops evenly from 0 to 1", () => {
    expect([0, 1, 2, 3, 4].map((i) => indexToProgress(i, 5))).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });

  it("handles a single stop", () => {
    expect(indexToProgress(0, 1)).toBe(0);
  });
});

describe("segmentAt", () => {
  it.each([
    [0, 0, 0],
    [0.125, 0, 0.5],
    [0.25, 1, 0],
    [0.3125, 1, 0.25],
    [0.75, 3, 0],
    [0.875, 3, 0.5],
  ])("progress %d -> lower stop %d, %d of the way to the next", (progress, lower, fraction) => {
    const segment = segmentAt(progress, 5);
    expect(segment.lower).toBe(lower);
    expect(segment.upper).toBe(lower + 1);
    expect(segment.fraction).toBeCloseTo(fraction);
  });

  it("treats the last stop as the end of the final segment", () => {
    expect(segmentAt(1, 5)).toEqual({ lower: 3, upper: 4, fraction: 1 });
  });

  it("gives a full 0..1 sweep for every stop-to-stop move", () => {
    for (let i = 0; i < 4; i++) {
      expect(segmentAt(indexToProgress(i, 5) + 0.001, 5).fraction).toBeCloseTo(0, 1);
      expect(segmentAt(indexToProgress(i + 1, 5) - 0.001, 5).fraction).toBeCloseTo(1, 1);
    }
  });

  it("clamps out-of-range input and handles degenerate tracks", () => {
    expect(segmentAt(-1, 5)).toEqual({ lower: 0, upper: 1, fraction: 0 });
    expect(segmentAt(2, 5)).toEqual({ lower: 3, upper: 4, fraction: 1 });
    expect(segmentAt(0.5, 1)).toEqual({ lower: 0, upper: 0, fraction: 0 });
  });
});

describe("pointerToProgress", () => {
  it("maps x over the track and clamps outside it", () => {
    expect(pointerToProgress(150, 100, 200)).toBe(0.25);
    expect(pointerToProgress(50, 100, 200)).toBe(0);
    expect(pointerToProgress(400, 100, 200)).toBe(1);
    expect(pointerToProgress(150, 100, 0)).toBe(0);
  });
});

describe("indexForKey", () => {
  it("moves one stop with arrows and stays in range", () => {
    expect(indexForKey("ArrowRight", 1, 5)).toBe(2);
    expect(indexForKey("ArrowUp", 1, 5)).toBe(2);
    expect(indexForKey("ArrowLeft", 1, 5)).toBe(0);
    expect(indexForKey("ArrowDown", 0, 5)).toBe(0);
    expect(indexForKey("ArrowRight", 4, 5)).toBe(4);
  });

  it("jumps to the ends with Home/End and ignores other keys", () => {
    expect(indexForKey("Home", 3, 5)).toBe(0);
    expect(indexForKey("End", 1, 5)).toBe(4);
    expect(indexForKey("Enter", 1, 5)).toBeNull();
  });
});
