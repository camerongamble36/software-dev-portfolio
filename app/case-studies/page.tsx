import type { Metadata } from "next";
import { CaseStudyGrid } from "@/components/case-studies/case-study-grid";
import { getAllCaseStudies } from "@/lib/case-studies/loader";

export const metadata: Metadata = {
  title: "Case studies",
  description: "Projects I've built: the problem, my role, the approach, and the outcome.",
};

export default function CaseStudiesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Case studies</h1>
      <p className="mt-3 max-w-2xl text-lg text-secondary">
        The problem, my role, the approach and the outcome. Each one has a 30-second version and a
        PDF you can download.
      </p>
      <div className="mt-8">
        <CaseStudyGrid caseStudies={getAllCaseStudies()} />
      </div>
    </div>
  );
}
