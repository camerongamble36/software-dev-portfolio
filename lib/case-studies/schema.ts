import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const caseStudySchema = z
  .object({
    slug: z.string().regex(slugPattern, "slug must be kebab-case"),
    title: z.string().min(1),
    summary: z.string().min(1).max(160, "summary is a one-liner (160 chars max)"),
    tags: z.array(z.string().min(1)).min(1),
    role: z.string().min(1),
    problem: z.string().min(1),
    approach: z.string().min(1),
    stack: z.array(z.string().min(1)).min(1),
    outcome: z.string().min(1),
    /** The 30-second version: 2-3 sentences. */
    quick: z.string().min(1).max(400, "quick is the 30-second version (400 chars max)"),
    /** Public path of the static PDF, e.g. /case-studies/<slug>.pdf */
    pdf: z.string(),
    /** Marks stand-in content so the UI labels it clearly. */
    placeholder: z.boolean().default(false),
  })
  .strict()
  .refine((cs) => cs.pdf === `/case-studies/${cs.slug}.pdf`, {
    message: "pdf must be /case-studies/<slug>.pdf",
    path: ["pdf"],
  });

export type CaseStudyInput = z.input<typeof caseStudySchema>;
export type CaseStudy = z.output<typeof caseStudySchema>;
