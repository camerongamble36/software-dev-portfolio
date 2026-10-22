import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getAllAudiences } from "@/lib/audiences";
import { getAllCaseStudies } from "@/lib/case-studies/loader";
import {
  SNAPSHOT_SCHEMA_VERSION,
  publishedSnapshotSchema,
  snapshotJsonSchema,
} from "@/lib/snapshot";

const contractPath = path.join(process.cwd(), "contract/portfolio-snapshot.schema.json");
const generated = JSON.stringify(snapshotJsonSchema(), null, 2) + "\n";

describe("published snapshot contract", () => {
  it("matches the committed JSON Schema (run with UPDATE_CONTRACT=1 to regenerate)", () => {
    if (process.env.UPDATE_CONTRACT === "1") writeFileSync(contractPath, generated);
    // If this fails, regenerate and copy the file into Canvas web-api too.
    expect(readFileSync(contractPath, "utf8")).toBe(generated);
  });

  it("accepts a snapshot built from today's content", () => {
    const pdfs = Object.fromEntries(
      getAllCaseStudies().map((cs) => [cs.slug, { sha256: "a".repeat(64) }]),
    );
    const snapshot = {
      schemaVersion: SNAPSHOT_SCHEMA_VERSION,
      publishedAt: "2026-10-21T12:00:00Z",
      caseStudies: getAllCaseStudies(),
      audiences: getAllAudiences(),
      pdfs,
    };
    expect(publishedSnapshotSchema.safeParse(snapshot).success).toBe(true);
  });

  it("rejects an unknown schema version", () => {
    const result = publishedSnapshotSchema.safeParse({
      schemaVersion: SNAPSHOT_SCHEMA_VERSION + 1,
      publishedAt: "2026-10-21T12:00:00Z",
      caseStudies: [],
      audiences: getAllAudiences(),
      pdfs: {},
    });
    expect(result.success).toBe(false);
  });
});
