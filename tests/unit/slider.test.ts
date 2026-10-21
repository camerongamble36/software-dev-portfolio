import { describe, expect, it } from "vitest";
import { indexForKey, indexToProgress, pointerToProgress, progressToIndex } from "@/lib/slider";

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
