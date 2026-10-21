"use client";

import { motion } from "motion/react";
import { useAudience } from "@/components/audience/audience-provider";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { getAudience } from "@/lib/audiences";
import { orderCaseStudies } from "@/lib/case-studies/order";
import type { CaseStudy } from "@/lib/case-studies/schema";

/** Case studies ordered for the selected audience, with its picks highlighted. */
export function CaseStudyGrid({
  caseStudies,
  limit,
}: {
  caseStudies: CaseStudy[];
  limit?: number;
}) {
  const { audience } = useAudience();
  const { featured, label } = getAudience(audience);
  const ranked = orderCaseStudies(caseStudies, featured).slice(0, limit);
  const badge = `Picked for: ${label}`;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ranked.map(({ caseStudy, featured }) => (
        <motion.li key={caseStudy.slug} layout transition={{ duration: 0.3 }}>
          <CaseStudyCard caseStudy={caseStudy} highlight={featured ? badge : undefined} />
        </motion.li>
      ))}
    </ul>
  );
}
