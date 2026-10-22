import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getAllCaseStudies, getCaseStudy, parseCaseStudies } from "@/lib/case-studies/loader";
import { orderCaseStudies } from "@/lib/case-studies/order";
import { caseStudySchema, type CaseStudyInput } from "@/lib/case-studies/schema";

const valid: CaseStudyInput = {
  slug: "example-project",
  title: "Example",
  summary: "One line.",
  tags: ["Web"],
  role: "Developer",
  problem: "A problem.",
  approach: "An approach.",
  stack: ["Next.js"],
  outcome: "An outcome.",
  quick: "Short version.",
  pdf: "/case-studies/example-project.pdf",
};

describe("caseStudySchema", () => {
  it("accepts a complete case study and defaults placeholder to false", () => {
    expect(caseStudySchema.parse(valid).placeholder).toBe(false);
  });

  it.each<[string, Partial<CaseStudyInput>]>([
    ["non-kebab slug", { slug: "Example Project" }],
    ["empty title", { title: "" }],
    ["no tags", { tags: [] }],
    ["empty stack", { stack: [] }],
    ["over-long summary", { summary: "x".repeat(161) }],
    ["pdf not matching slug", { pdf: "/case-studies/other.pdf" }],
    ["pdf outside public/case-studies", { pdf: "https://example.com/example-project.pdf" }],
  ])("rejects %s", (_, override) => {
    expect(caseStudySchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });

  it("rejects unknown fields so typos don't slip through", () => {
    expect(caseStudySchema.safeParse({ ...valid, outcomes: "typo" }).success).toBe(false);
  });
});

describe("case-study loader", () => {
  it("loads the committed content", () => {
    const all = getAllCaseStudies();
    expect(all.length).toBeGreaterThanOrEqual(2);
    expect(getCaseStudy(all[0].slug)).toEqual(all[0]);
    expect(getCaseStudy("does-not-exist")).toBeUndefined();
  });

  it("rejects duplicate slugs with a readable error", () => {
    expect(() => parseCaseStudies([valid, valid])).toThrow(/duplicate slug "example-project"/);
  });

  it("rejects invalid entries", () => {
    expect(() => parseCaseStudies([{ ...valid, slug: "" }])).toThrow(/Invalid case-study content/);
  });

  // The committed fixtures; the sync script copies them into public/ before dev and build.
  it.each(getAllCaseStudies().map((cs) => [cs.slug]))("%s has a fixture PDF", (slug) => {
    expect(existsSync(path.join(process.cwd(), "content/case-studies/pdfs", `${slug}.pdf`))).toBe(
      true,
    );
  });

  it("labels placeholder content as such", () => {
    for (const cs of getAllCaseStudies().filter((c) => c.placeholder)) {
      expect(cs.title).toMatch(/placeholder/i);
    }
  });
});

describe("orderCaseStudies", () => {
  const list = ["a", "b", "c"].map((slug) =>
    caseStudySchema.parse({ ...valid, slug, pdf: `/case-studies/${slug}.pdf` }),
  );

  it("puts featured slugs first, in order, and flags them", () => {
    const ranked = orderCaseStudies(list, ["c", "a"]);
    expect(ranked.map((r) => r.caseStudy.slug)).toEqual(["c", "a", "b"]);
    expect(ranked.map((r) => r.featured)).toEqual([true, true, false]);
  });

  it("ignores unknown and duplicate featured slugs", () => {
    const ranked = orderCaseStudies(list, ["zzz", "b", "b"]);
    expect(ranked.map((r) => r.caseStudy.slug)).toEqual(["b", "a", "c"]);
  });
});
