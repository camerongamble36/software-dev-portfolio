import Link from "next/link";
import { AudienceHero } from "@/components/audience/audience-hero";
import { CaseStudyGrid } from "@/components/case-studies/case-study-grid";
import { getAllCaseStudies } from "@/lib/case-studies/loader";

export default function HomePage() {
  return (
    <>
      <AudienceHero />
      <section aria-labelledby="featured-heading" className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="featured-heading" className="text-2xl font-semibold tracking-tight">
            Featured case studies
          </h2>
          <Link href="/case-studies" className="text-sm text-link underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="mt-6">
          <CaseStudyGrid caseStudies={getAllCaseStudies()} limit={3} />
        </div>
      </section>
    </>
  );
}
