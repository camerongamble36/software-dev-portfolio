import { z } from "zod";
import { MAX_AUDIENCES, MIN_AUDIENCES, audienceDefinitionSchema } from "@/lib/audiences";
import { caseStudySchema } from "@/lib/case-studies/schema";

/**
 * The published content snapshot Canvas hands this site at build time (see
 * docs/content-source.md). Bump the version for any breaking change, on both sides.
 */
export const SNAPSHOT_SCHEMA_VERSION = 1;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const publishedSnapshotSchema = z
  .object({
    schemaVersion: z.literal(SNAPSHOT_SCHEMA_VERSION),
    publishedAt: z.iso.datetime(),
    caseStudies: z.array(caseStudySchema),
    audiences: z.array(audienceDefinitionSchema).min(MIN_AUDIENCES).max(MAX_AUDIENCES),
    /** Where the build downloads each case study's PDF, and its expected sha256. */
    pdfs: z.record(
      slug,
      z.object({ url: z.url(), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
    ),
  })
  .strict();

export type PublishedSnapshot = z.output<typeof publishedSnapshotSchema>;

/**
 * JSON Schema for the snapshot, committed at contract/portfolio-snapshot.schema.json and
 * copied into Canvas web-api, which validates every publish against it. Cross-field rules
 * (unique ids, featured slugs exist, a PDF per case study) aren't expressible here; both
 * sides check them in code.
 */
export function snapshotJsonSchema() {
  return z.toJSONSchema(publishedSnapshotSchema, { io: "input" });
}
