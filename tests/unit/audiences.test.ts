import { describe, expect, it } from "vitest";
import { audienceContent } from "@/content/audiences";
import { AUDIENCES, AUDIENCE_LABELS, audienceSchema, parseAudience } from "@/lib/audiences";
import { getAllCaseStudies } from "@/lib/case-studies/loader";

describe("audiences", () => {
  it("lists the five audiences in slider order", () => {
    expect(AUDIENCES).toEqual(["recruiter", "manager", "peer", "friend-family", "partner"]);
  });

  it("has a label for every audience", () => {
    expect(Object.keys(AUDIENCE_LABELS).sort()).toEqual([...AUDIENCES].sort());
  });

  it("accepts known audiences and rejects anything else", () => {
    expect(audienceSchema.parse("peer")).toBe("peer");
    expect(parseAudience("partner")).toBe("partner");
    expect(parseAudience("admin")).toBeNull();
    expect(parseAudience(null)).toBeNull();
    expect(parseAudience(3)).toBeNull();
  });
});

describe("audience content", () => {
  const slugs = new Set(getAllCaseStudies().map((cs) => cs.slug));

  it.each(AUDIENCES)("%s has short copy and only features real case studies", (audience) => {
    const content = audienceContent[audience];
    expect(content.headline.length).toBeGreaterThan(0);
    expect(content.headline.length).toBeLessThanOrEqual(80);
    expect(content.intro).toHaveLength(2);
    for (const slug of content.featured) expect(slugs).toContain(slug);
  });
});
