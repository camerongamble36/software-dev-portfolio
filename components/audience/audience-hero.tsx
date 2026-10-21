"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { audienceContent } from "@/content/audiences";
import { site } from "@/content/site";
import { useAudience } from "@/components/audience/audience-provider";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui/button";
import { AUDIENCES, AUDIENCE_LABELS, type Audience } from "@/lib/audiences";
import {
  indexForKey,
  indexToProgress,
  pointerToProgress,
  progressToIndex,
  segmentAt,
} from "@/lib/slider";
import { cn } from "@/lib/utils";

const STOPS = AUDIENCES.length;
/** Pointer travel (px) before a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 4;
/** Seconds per stop-to-stop sweep for taps and key presses, capped for long jumps. */
const SWEEP_PER_STOP = 0.5;
const MAX_SWEEP = 1.6;
const SWEEP_EASE = [0.65, 0, 0.35, 1] as const;
const SNAP = { type: "spring", stiffness: 500, damping: 40 } as const;

const ACCENT_DOT: Record<Audience, string> = {
  recruiter: "bg-brand",
  manager: "bg-accent-blue",
  peer: "bg-accent-teal",
  "friend-family": "bg-accent-pink",
  partner: "bg-accent-gold",
};

function HeroCopy({ audience, headingId }: { audience: Audience; headingId?: string }) {
  const copy = audienceContent[audience];
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      <p className="inline-flex items-center gap-2 rounded-full border border-line-subtle bg-surface px-3 py-1 text-sm text-secondary">
        <span aria-hidden className={cn("size-2 rounded-full", ACCENT_DOT[audience])} />
        For: {AUDIENCE_LABELS[audience]}
      </p>
      <h1
        id={headingId}
        className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
      >
        {copy.headline}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-secondary">
        {copy.intro[0]}
        <br />
        {copy.intro[1]}
      </p>
    </div>
  );
}

export function AudienceHero() {
  const { audience, setAudience } = useAudience();
  const reduceMotion = useReducedMotion() ?? false;
  const committedIndex = AUDIENCES.indexOf(audience);

  // The stop the user is moving to; null when idle.
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const targetRef = useRef<number | null>(null);
  const committedRef = useRef(committedIndex);
  // True from the start of a drag/jump until it settles on a stop.
  const [moving, setMoving] = useState(false);
  const movingRef = useRef(false);

  // Thumb position (0..1 along the track). The wipe is derived from it: between two
  // adjacent stops the divider crosses the full section width, so every change is
  // one edge-to-edge sweep. Left of the divider shows the higher stop's audience.
  const progress = useMotionValue(indexToProgress(committedIndex, STOPS));
  const [lowerStop, setLowerStop] = useState(() => segmentAt(progress.get(), STOPS).lower);
  useMotionValueEvent(progress, "change", (p) => {
    const { lower } = segmentAt(p, STOPS);
    if (lower !== lowerStop) setLowerStop(lower);
  });

  const thumbLeft = useTransform(progress, (p) => `${p * 100}%`);
  const sweep = useTransform(progress, (p) => segmentAt(p, STOPS).fraction * 100);
  const dividerLeft = useTransform(sweep, (s) => `${s}%`);
  const clipPath = useTransform(sweep, (s) => `inset(0 ${100 - s}% 0 0)`);

  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; startX: number; dragging: boolean } | null>(null);
  const animation = useRef<AnimationPlaybackControls | null>(null);
  const runToken = useRef(0);

  // Keep the thumb on the committed stop when the audience changes from outside
  // (hydration from localStorage, another tab).
  useEffect(() => {
    committedRef.current = committedIndex;
    if (!movingRef.current) progress.set(indexToProgress(committedIndex, STOPS));
  }, [committedIndex, progress]);

  function setTarget(index: number | null) {
    targetRef.current = index;
    setTargetIndex(index);
  }

  function setIsMoving(value: boolean) {
    movingRef.current = value;
    setMoving(value);
  }

  function stopAnimation() {
    runToken.current += 1;
    animation.current?.stop();
    animation.current = null;
  }

  function settle(index: number) {
    setIsMoving(false);
    setTarget(null);
    if (index !== committedRef.current) {
      committedRef.current = index;
      setAudience(AUDIENCES[index]);
    }
  }

  /** Move the thumb to a stop (sweeping once per stop crossed), then commit. */
  function goTo(index: number, { fromDrag }: { fromDrag: boolean }) {
    stopAnimation();
    const stop = indexToProgress(index, STOPS);
    setTarget(index);

    if (reduceMotion) {
      progress.set(stop);
      settle(index);
      return;
    }

    setIsMoving(true);
    const stopsToTravel = Math.abs(stop - progress.get()) * (STOPS - 1);
    // A released drag springs the rest of the way; a tap or key press sweeps at a steady
    // pace per stop so multi-stop jumps show each change in turn.
    const transition = fromDrag
      ? SNAP
      : {
          duration: Math.min(SWEEP_PER_STOP * stopsToTravel, MAX_SWEEP),
          ease: stopsToTravel > 1 ? ("linear" as const) : SWEEP_EASE,
        };
    const token = runToken.current;
    const controls = animate(progress, stop, transition);
    animation.current = controls;
    controls.then(() => {
      if (token === runToken.current) settle(index);
    });
  }

  function trackPointer(clientX: number) {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const p = pointerToProgress(clientX, rect.left, rect.width);
    progress.set(p);
    const nearest = progressToIndex(p, STOPS);
    if (nearest !== targetRef.current) setTarget(nearest);
  }

  function nearestStopAt(clientX: number) {
    const rect = railRef.current?.getBoundingClientRect();
    if (!rect) return committedRef.current;
    return progressToIndex(pointerToProgress(clientX, rect.left, rect.width), STOPS);
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointer.current = { id: e.pointerId, startX: e.clientX, dragging: false };
    thumbRef.current?.focus({ preventScroll: true });
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const state = pointer.current;
    if (!state || state.id !== e.pointerId) return;
    if (!state.dragging) {
      if (Math.abs(e.clientX - state.startX) < DRAG_THRESHOLD) return;
      state.dragging = true;
      stopAnimation();
      setIsMoving(true);
    }
    trackPointer(e.clientX);
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const state = pointer.current;
    if (!state || state.id !== e.pointerId) return;
    pointer.current = null;
    if (state.dragging) goTo(progressToIndex(progress.get(), STOPS), { fromDrag: true });
    else goTo(nearestStopAt(e.clientX), { fromDrag: false }); // a tap on a stop or label
  }

  function onPointerCancel(e: PointerEvent<HTMLDivElement>) {
    // The browser took the gesture (e.g. a vertical scroll). Settle where we are.
    const state = pointer.current;
    if (!state || state.id !== e.pointerId) return;
    pointer.current = null;
    if (state.dragging) goTo(progressToIndex(progress.get(), STOPS), { fromDrag: true });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const current = targetRef.current ?? committedRef.current;
    const next = indexForKey(e.key, current, STOPS);
    if (next === null) return;
    e.preventDefault();
    if (next !== current) goTo(next, { fromDrag: false });
  }

  const shownIndex = targetIndex ?? committedIndex;
  const sweeping = moving && !reduceMotion;
  // While sweeping, the base layer shows the lower stop and the clipped layer the upper.
  // Otherwise the base shows the committed audience (or, with reduced motion, the
  // stop being dragged to: an instant swap).
  const baseAudience = sweeping ? AUDIENCES[lowerStop] : AUDIENCES[shownIndex];

  return (
    <section
      aria-labelledby="hero-heading"
      data-audience={audience}
      data-testid="audience-hero"
      className="relative overflow-hidden border-b border-line-subtle"
    >
      <div className="grid pt-12 sm:pt-20">
        <div className="[grid-area:1/1]">
          <HeroCopy audience={baseAudience} headingId="hero-heading" />
        </div>
        {sweeping && (
          <motion.div
            aria-hidden
            data-testid="audience-reveal"
            className="bg-canvas [grid-area:1/1]"
            style={{ clipPath }}
          >
            <HeroCopy audience={AUDIENCES[lowerStop + 1]} />
          </motion.div>
        )}
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/case-studies" className={buttonVariants()}>
            See case studies
          </Link>
          <a href={site.githubUrl} className={buttonVariants({ variant: "outline" })}>
            <GithubIcon /> GitHub
          </a>
          {site.linkedinUrl && (
            <a href={site.linkedinUrl} className={buttonVariants({ variant: "outline" })}>
              <LinkedinIcon /> LinkedIn
            </a>
          )}
          {site.chatEnabled && (
            <Link href="/chat" className={buttonVariants({ variant: "outline" })}>
              Ask the chatbot
            </Link>
          )}
        </div>

        <div className="mt-12">
          <p id="audience-slider-label" className="text-sm font-medium text-secondary">
            Who&apos;s visiting? Slide to tailor the site.
          </p>
          {/* Pointer area: track + labels. pan-y keeps vertical page scrolling on touch. */}
          <div
            data-testid="audience-track"
            className="mt-3 cursor-pointer touch-pan-y select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
          >
            <div className="relative h-11">
              {/* Stops sit at the centres of the 5 label columns below: 10%, 30%, ... 90%. */}
              <div
                ref={railRef}
                className="absolute inset-x-[10%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-line-subtle"
              >
                <motion.div
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-full bg-brand"
                  style={{ width: thumbLeft }}
                />
                {AUDIENCES.map((a, i) => (
                  <span
                    key={a}
                    aria-hidden
                    className={cn(
                      "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2",
                      i <= shownIndex ? "border-brand bg-brand" : "border-line bg-surface",
                    )}
                    style={{ left: `${indexToProgress(i, STOPS) * 100}%` }}
                  />
                ))}
                <motion.div
                  ref={thumbRef}
                  role="slider"
                  tabIndex={0}
                  aria-labelledby="audience-slider-label"
                  aria-valuemin={0}
                  aria-valuemax={STOPS - 1}
                  aria-valuenow={shownIndex}
                  aria-valuetext={AUDIENCE_LABELS[AUDIENCES[shownIndex]]}
                  aria-orientation="horizontal"
                  data-testid="audience-thumb"
                  onKeyDown={onKeyDown}
                  className="absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-grab place-items-center rounded-full active:cursor-grabbing"
                  style={{ left: thumbLeft }}
                >
                  <span className="size-7 rounded-full border-2 border-brand bg-surface shadow-md" />
                </motion.div>
              </div>
            </div>
            <div
              aria-hidden
              className="mt-1 grid grid-cols-5 text-center text-xs leading-tight sm:text-sm"
            >
              {AUDIENCES.map((a, i) => (
                <span
                  key={a}
                  className={cn(
                    "px-0.5",
                    i === shownIndex ? "font-semibold text-primary" : "text-secondary",
                  )}
                >
                  {AUDIENCE_LABELS[a]}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* The divider: a full-height line that crosses the full width once per stop. Hidden when idle. */}
      <motion.div
        aria-hidden
        data-testid="audience-divider"
        data-active={sweeping}
        className={cn(
          "pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-brand transition-opacity duration-150",
          sweeping ? "opacity-100" : "opacity-0",
        )}
        style={{ left: dividerLeft }}
      />
    </section>
  );
}
