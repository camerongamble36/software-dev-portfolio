import { describe, expect, it } from "vitest";
import { audienceEntries } from "@/content/audiences";
import {
  AUDIENCES,
  DEFAULT_AUDIENCE,
  MAX_AUDIENCES,
  getAllAudiences,
  getAudience,
  parseAudience,
  parseAudienceDefinitions,
  type AudienceInput,
} from "@/lib/audiences";
import { getAllCaseStudies } from "@/lib/case-studies/loader";

const entry = (id: string): AudienceInput => ({
  id,
  label: `Label ${id}`,
  accent: "teal",
  contactTopic: "hello",
  headline: "A headline.",
  intro: ["Line one.", "Line two."],
  featured: [],
});

describe("audiences", () => {
  it("lists the current audiences in slider order, first is the default", () => {
    expect(AUDIENCES).toEqual(["recruiter", "manager", "peer", "friend-family", "partner"]);
    expect(DEFAULT_AUDIENCE).toBe("recruiter");
  });

  it("accepts known audiences and rejects anything else", () => {
    expect(parseAudience("partner")).toBe("partner");
    expect(parseAudience("admin")).toBeNull();
    expect(parseAudience(null)).toBeNull();
    expect(parseAudience(3)).toBeNull();
  });

  it("falls back to the default for an unknown (e.g. removed) audience", () => {
    expect(getAudience("an-audience-that-was-removed").id).toBe(DEFAULT_AUDIENCE);
  });
});

describe("audience content", () => {
  const slugs = new Set(getAllCaseStudies().map((cs) => cs.slug));

  it.each(getAllAudiences().map((a) => [a.id, a]))(
    "%s only features real case studies",
    (_, audience) => {
      for (const slug of audience.featured) expect(slugs).toContain(slug);
    },
  );
});

describe("parseAudienceDefinitions", () => {
  it("accepts adding a new audience", () => {
    const list = parseAudienceDefinitions([...audienceEntries, entry("investor")]);
    expect(list.map((a) => a.id)).toContain("investor");
  });

  it("accepts removing audiences down to the minimum", () => {
    expect(parseAudienceDefinitions(audienceEntries.slice(0, 2))).toHaveLength(2);
  });

  it.each<[string, unknown[]]>([
    ["fewer than two", [entry("solo")]],
    [
      "too many for the slider",
      Array.from({ length: MAX_AUDIENCES + 1 }, (_, i) => entry(`a${i}`)),
    ],
    ["duplicate ids", [entry("same"), entry("same")]],
    ["a non-kebab id", [entry("Bad Id"), entry("ok")]],
    ["an unknown accent", [{ ...entry("a"), accent: "neon" }, entry("b")]],
    ["an unknown contact topic", [{ ...entry("a"), contactTopic: "sales" }, entry("b")]],
    ["a one-line intro", [{ ...entry("a"), intro: ["only one"] }, entry("b")]],
    ["an unexpected field (typo)", [{ ...entry("a"), lable: "x" }, entry("b")]],
  ])("rejects %s", (_, list) => {
    expect(() => parseAudienceDefinitions(list)).toThrow(/Invalid audience content/);
  });
});
