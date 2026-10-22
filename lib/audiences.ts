import { z } from "zod";
import contentSource from "@content-source";
import { CONTACT_TOPICS } from "@/lib/contact";

/**
 * Audiences are data (content/audiences.ts, or Canvas: see next.config.ts), validated here once at build time and shared by
 * the UI, case-study ordering, the contact form and (later) the chatbot persona.
 * Kept JSON-shaped so the same schema can validate audiences from another source later.
 */

/** Accent keys an audience can use. Each maps to Canvas chart tokens (see audience-accents.ts). */
export const ACCENTS = ["violet", "blue", "teal", "pink", "gold"] as const;
export type Accent = (typeof ACCENTS)[number];

export const MIN_AUDIENCES = 2;
/** More stops than this won't fit the slider labels at phone widths. */
export const MAX_AUDIENCES = 6;

export const audienceDefinitionSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "id must be kebab-case"),
    label: z.string().min(1).max(24, "label is shown under the slider (24 chars max)"),
    accent: z.enum(ACCENTS),
    contactTopic: z.enum(CONTACT_TOPICS),
    headline: z.string().min(1).max(80, "headline is short (80 chars max)"),
    intro: z.tuple([z.string().min(1), z.string().min(1)]),
    featured: z.array(z.string()),
  })
  .strict();

export type AudienceInput = z.input<typeof audienceDefinitionSchema>;
export type AudienceDefinition = z.output<typeof audienceDefinitionSchema>;

const audienceListSchema = z
  .array(audienceDefinitionSchema)
  .min(MIN_AUDIENCES)
  .max(MAX_AUDIENCES)
  .superRefine((list, ctx) => {
    const seen = new Set<string>();
    list.forEach((a, i) => {
      if (seen.has(a.id)) {
        ctx.addIssue({ code: "custom", message: `duplicate id "${a.id}"`, path: [i, "id"] });
      }
      seen.add(a.id);
    });
  });

/** Validate raw audience content. Throws with a readable message so `next build` fails loudly. */
export function parseAudienceDefinitions(raw: unknown): AudienceDefinition[] {
  const result = audienceListSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid audience content:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

const definitions = parseAudienceDefinitions(contentSource.audiences);
const byId = new Map(definitions.map((a) => [a.id, a]));

/** An audience id. A plain string, since audiences are data that can change. */
export type Audience = string;

/** Audience ids in slider order. */
export const AUDIENCES: readonly Audience[] = definitions.map((a) => a.id);
export const DEFAULT_AUDIENCE: Audience = AUDIENCES[0];

/** Validates an id against the current audiences (used on untrusted input). */
export const audienceSchema = z.enum(AUDIENCES as [Audience, ...Audience[]]);

export function getAllAudiences(): readonly AudienceDefinition[] {
  return definitions;
}

/** The definition for an id; unknown ids get the default audience. */
export function getAudience(id: Audience): AudienceDefinition {
  return byId.get(id) ?? byId.get(DEFAULT_AUDIENCE)!;
}

/** Parse untrusted input (localStorage, request bodies) into an audience, or null. */
export function parseAudience(value: unknown): Audience | null {
  const result = audienceSchema.safeParse(value);
  return result.success ? result.data : null;
}
