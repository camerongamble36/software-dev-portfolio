import Link from "next/link";
import type { CaseStudy } from "@/lib/case-studies/schema";
import { cn } from "@/lib/utils";

export function Tag({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md border border-line-subtle bg-sunken px-2 py-0.5 text-xs text-secondary",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CaseStudyCard({
  caseStudy,
  highlight,
}: {
  caseStudy: CaseStudy;
  /** Shown as a badge, e.g. "Picked for recruiters". */
  highlight?: string;
}) {
  return (
    <article
      data-testid="case-study-card"
      data-slug={caseStudy.slug}
      className={cn(
        "relative flex h-full flex-col rounded-xl border bg-surface p-5 transition-[border-color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-md motion-reduce:hover:translate-y-0",
        highlight ? "border-brand" : "border-line-subtle",
      )}
    >
      <div className="flex flex-wrap gap-2">
        {highlight && (
          <span className="rounded-md bg-brand-subtle px-2 py-0.5 text-xs font-medium text-link">
            {highlight}
          </span>
        )}
        {caseStudy.placeholder && (
          <span className="rounded-md border border-dashed border-line px-2 py-0.5 text-xs font-medium text-secondary">
            Placeholder
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg font-semibold">
        {/* Stretched link: the whole card is clickable, but only the title is announced. */}
        <Link
          href={`/case-studies/${caseStudy.slug}`}
          className="after:absolute after:inset-0 after:rounded-xl"
        >
          {caseStudy.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-secondary">{caseStudy.summary}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
        {caseStudy.tags.map((tag) => (
          <li key={tag}>
            <Tag>{tag}</Tag>
          </li>
        ))}
      </ul>
    </article>
  );
}
