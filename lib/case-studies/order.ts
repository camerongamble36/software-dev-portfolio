import type { CaseStudy } from "./schema";

export type RankedCaseStudy = { caseStudy: CaseStudy; featured: boolean };

/**
 * Put an audience's featured slugs first (in their listed order), then the rest
 * in their original order. Unknown slugs in `featured` are ignored.
 */
export function orderCaseStudies(list: CaseStudy[], featured: string[]): RankedCaseStudy[] {
  const bySlug = new Map(list.map((cs) => [cs.slug, cs]));
  const featuredSet = new Set(featured.filter((slug) => bySlug.has(slug)));

  const first = [...featuredSet].map((slug) => ({ caseStudy: bySlug.get(slug)!, featured: true }));
  const rest = list
    .filter((cs) => !featuredSet.has(cs.slug))
    .map((caseStudy) => ({ caseStudy, featured: false }));

  return [...first, ...rest];
}
