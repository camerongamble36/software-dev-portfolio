import { ArrowLeft, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Tag } from "@/components/case-studies/case-study-card";
import { StoryToggle } from "@/components/case-studies/story-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getAllCaseStudies, getCaseStudy } from "@/lib/case-studies/loader";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return getAllCaseStudies().map((cs) => ({ slug: cs.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/case-studies/[slug]">): Promise<Metadata> {
  const caseStudy = getCaseStudy((await params).slug);
  return caseStudy ? { title: caseStudy.title, description: caseStudy.summary } : {};
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold tracking-wide text-secondary uppercase">{title}</h2>
      <div className="mt-2 text-lg">{children}</div>
    </section>
  );
}

// The back link is the URL-independent App Shell; everything that reads `params`
// sits behind Suspense so links can prefetch one shared shell for the route.
// Known slugs are fully prerendered. An unknown slug renders the not-found UI
// (with noindex); its first hit streams as a 200 because the shell is already sent.
export default function CaseStudyPage({ params }: PageProps<"/case-studies/[slug]">) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/case-studies"
        className="inline-flex min-h-11 items-center gap-1 text-sm text-link underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" /> All case studies
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <CaseStudyDetail params={params} />
      </Suspense>
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div aria-hidden className="mt-4 animate-pulse space-y-4">
      <div className="h-10 w-3/4 rounded-lg bg-sunken" />
      <div className="h-6 w-full rounded-lg bg-sunken" />
      <div className="h-11 w-40 rounded-lg bg-sunken" />
    </div>
  );
}

async function CaseStudyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const caseStudy = getCaseStudy((await params).slug);
  if (!caseStudy) notFound();

  return (
    <>
      {caseStudy.placeholder && (
        <p className="mt-4 rounded-lg border border-dashed border-line bg-sunken px-4 py-3 text-sm text-secondary">
          This is placeholder content. The real case study is coming soon.
        </p>
      )}

      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {caseStudy.title}
      </h1>
      <p className="mt-3 text-lg text-secondary">{caseStudy.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
        {caseStudy.tags.map((tag) => (
          <li key={tag}>
            <Tag>{tag}</Tag>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <a
          href={caseStudy.pdf}
          download
          data-testid="pdf-download"
          className={buttonVariants({ variant: "outline" })}
        >
          <Download aria-hidden /> Download PDF
        </a>
      </div>

      <div className="mt-10">
        <StoryToggle
          quick={<p className="text-lg">{caseStudy.quick}</p>}
          full={
            <div className="space-y-8">
              <Section title="Problem">{caseStudy.problem}</Section>
              <Section title="My role">{caseStudy.role}</Section>
              <Section title="Approach">{caseStudy.approach}</Section>
              <Section title="Stack">
                <ul className="flex flex-wrap gap-1.5">
                  {caseStudy.stack.map((item) => (
                    <li key={item}>
                      <Tag className="text-sm">{item}</Tag>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Outcome">{caseStudy.outcome}</Section>
            </div>
          }
        />
      </div>

      <aside className="mt-12 rounded-xl border border-line-subtle bg-surface p-5">
        <p className="font-medium">Want to talk about this project, or something like it?</p>
        <Link href="/contact" className={cn(buttonVariants({ variant: "outline" }), "mt-3")}>
          Get in touch
        </Link>
      </aside>
    </>
  );
}
