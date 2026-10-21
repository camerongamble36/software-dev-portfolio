import { z } from "zod";

/**
 * The single source of truth for who the site can be tuned for.
 * Order matters: it is the left-to-right order of the slider stops.
 * Used by the UI, case-study ordering and (later) the chatbot persona.
 */
export const AUDIENCES = ["recruiter", "manager", "peer", "friend-family", "partner"] as const;

export const audienceSchema = z.enum(AUDIENCES);

export type Audience = z.infer<typeof audienceSchema>;

export const AUDIENCE_LABELS: Record<Audience, string> = {
  recruiter: "Recruiter",
  manager: "Hiring manager",
  peer: "Fellow developer",
  "friend-family": "Friend or family",
  partner: "Business partner",
};

export const DEFAULT_AUDIENCE: Audience = "recruiter";

/** Parse untrusted input (localStorage, request bodies) into an audience, or null. */
export function parseAudience(value: unknown): Audience | null {
  const result = audienceSchema.safeParse(value);
  return result.success ? result.data : null;
}
