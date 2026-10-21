"use client";

import {
  animate,
  motion,
  useMotionValue,
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
import { indexForKey, indexToProgress, pointerToProgress, progressToIndex } from "@/lib/slider";
import { cn } from "@/lib/utils";

const STOPS = AUDIENCES.length;
/** Pointer travel (px) before a press counts as a drag rather than a tap. */
const DRAG_THRESHOLD = 4;
const SWEEP = { duration: 0.45, ease: [0.65, 0, 0.35, 1] as const };
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

  // Thumb position, and the divider/wipe position (0..1 across the section).
  const progress = useMotionValue(indexToProgress(committedIndex, STOPS));
  const reveal = useMotionValue(0);
  // +1 when moving right (new audience shows left of the divider), -1 when moving left.
  const direction = useMotionValue(1);

  const thumbLeft = useTransform(progress, (p) => `${p * 100}%`);
  const dividerLeft = useTransform(reveal, (r) => `${r * 100}%`);
  const clipPath = useTransform(() => {
    const r = reveal.get() * 100;
    return direction.get() >= 0 ? `inset(0 ${100 - r}% 0 0)` : `inset(0 0 0 ${r}%)`;
  });

  const railRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; startX: number; dragging: boolean } | null>(null);
  const animations = useRef<AnimationPlaybackControls[]>([]);
  const runToken = useRef(0);

  // Keep the thumb on the committed stop when the audience changes from outside
  // (hydration from localStorage, another tab).
  useEffect(() => {
    committedRef.current = committedIndex;
    if (targetRef.current === null) progress.set(indexToProgress(committedIndex, STOPS));
  }, [committedIndex, progress]);

  function setTarget(index: number | null) {
    targetRef.current = index;
    setTargetIndex(index);
    if (index !== null) direction.set(index >= committedRef.current ? 1 : -1);
  }

  function stopAnimations() {
    runToken.current += 1;
    animations.current.forEach((a) => a.stop());
    animations.current = [];
  }

  function commit(index: number) {
    committedRef.current = index;
    setAudience(AUDIENCES[index]);
    setTarget(null);
  }

  /** Move to a stop: snap the thumb and finish the wipe, then commit. */
  function goTo(index: number, { fromDrag }: { fromDrag: boolean }) {
    stopAnimations();
    const stop = indexToProgress(index, STOPS);

    if (index === committedRef.current) {
      setTarget(null);
      if (reduceMotion) progress.set(stop);
      else animations.current = [animate(progress, stop, SNAP)];
      return;
    }

    setTarget(index);
    if (reduceMotion) {
      progress.set(stop);
      commit(index);
      return;
    }

    const movingRight = index > committedRef.current;
    // A tap or key press gets a full-width sweep; a drag continues from where it is.
    if (!fromDrag) reveal.set(movingRight ? 0 : 1);

    const token = runToken.current;
    const thumb = animate(progress, stop, SNAP);
    const wipe = animate(reveal, movingRight ? 1 : 0, SWEEP);
    animations.current = [thumb, wipe];
    Promise.all([thumb, wipe]).then(() => {
      if (token === runToken.current) commit(index);
    });
  }

  function trackPointer(clientX: number) {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const p = pointerToProgress(clientX, rect.left, rect.width);
    progress.set(p);
    reveal.set(p);
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
      stopAnimations();
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
  const revealing = targetIndex !== null && targetIndex !== committedIndex;

  return (
    <section
      aria-labelledby="hero-heading"
      data-audience={audience}
      data-testid="audience-hero"
      className="relative overflow-hidden border-b border-line-subtle"
    >
      <div className="grid pt-12 sm:pt-20">
        <div className="[grid-area:1/1]">
          <HeroCopy audience={audience} headingId="hero-heading" />
        </div>
        {revealing && (
          <motion.div
            aria-hidden
            data-testid="audience-reveal"
            className="bg-canvas [grid-area:1/1]"
            style={{ clipPath }}
          >
            <HeroCopy audience={AUDIENCES[targetIndex]} />
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

      {/* The divider: a full-height line that tracks the wipe. Hidden when idle. */}
      <motion.div
        aria-hidden
        data-testid="audience-divider"
        data-active={revealing && !reduceMotion}
        className={cn(
          "pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-brand transition-opacity duration-150",
          revealing && !reduceMotion ? "opacity-100" : "opacity-0",
        )}
        style={{ left: dividerLeft }}
      />
    </section>
  );
}
