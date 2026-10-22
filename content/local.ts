import { audienceEntries } from "./audiences";
import { rawCaseStudies } from "./case-studies";

/**
 * The committed content, used in dev, unit tests, CI and e2e. Builds with
 * PORTFOLIO_CONTENT_SOURCE=canvas swap `@content-source` for the published snapshot
 * (content/generated/portfolio.json) instead; see next.config.ts.
 */
const localContent: { caseStudies: unknown[]; audiences: unknown[] } = {
  caseStudies: rawCaseStudies,
  audiences: audienceEntries,
};

export default localContent;
