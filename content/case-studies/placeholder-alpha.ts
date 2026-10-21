import type { CaseStudyInput } from "@/lib/case-studies/schema";

// PLACEHOLDER: replaced by a real case study in the content-planning phase.
const caseStudy: CaseStudyInput = {
  slug: "placeholder-alpha",
  title: "Placeholder case study A",
  summary: "Placeholder: stands in for a real project until the case studies are written.",
  tags: ["Placeholder", "Web", "TypeScript"],
  role: "Placeholder: the role I played (e.g. sole developer, tech lead).",
  problem: "Placeholder: the problem or opportunity, in a couple of plain sentences.",
  approach:
    "Placeholder: how I approached it, including the key decisions and the tradeoffs behind them.",
  stack: ["Next.js", "TypeScript", "Tailwind CSS"],
  outcome: "Placeholder: what changed because of the work, with numbers where they exist.",
  quick:
    "Placeholder: the 30-second version. Two or three sentences covering the problem, what I did, and the result.",
  pdf: "/case-studies/placeholder-alpha.pdf",
  placeholder: true,
};

export default caseStudy;
