import { z } from "zod";
import { rawCaseStudies } from "@/content/case-studies";
import { caseStudySchema, type CaseStudy } from "./schema";

const caseStudyListSchema = z.array(caseStudySchema).superRefine((list, ctx) => {
  const seen = new Set<string>();
  list.forEach((cs, i) => {
    if (seen.has(cs.slug)) {
      ctx.addIssue({ code: "custom", message: `duplicate slug "${cs.slug}"`, path: [i, "slug"] });
    }
    seen.add(cs.slug);
  });
});

/** Validate raw content. Throws with a readable message so `next build` fails loudly. */
export function parseCaseStudies(raw: unknown): CaseStudy[] {
  const result = caseStudyListSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid case-study content:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

// Parsed once at module load: any page that imports this validates content at build time.
const caseStudies = parseCaseStudies(rawCaseStudies);

export function getAllCaseStudies(): CaseStudy[] {
  return caseStudies;
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}
