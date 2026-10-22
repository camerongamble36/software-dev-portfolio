// Prepares content before `next dev` / `next build` (see docs/content-source.md).
//
//   PORTFOLIO_CONTENT_SOURCE=local  (default) copy the fixture PDFs from content/case-studies/pdfs
//   PORTFOLIO_CONTENT_SOURCE=canvas fetch the published snapshot + PDFs from Canvas
//                                   (needs CANVAS_API_URL and PORTFOLIO_READ_KEY)
//
// Canvas mode fails loudly on anything unexpected so the build stops and Vercel keeps
// serving the last good deployment. Deep validation (Zod) happens in lib/ at build time.

import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = ["local", "canvas"];
const FETCH_TIMEOUT_MS = 30_000;

export class SyncError extends Error {}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function resetPdfDir(dir) {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
}

/** The schema version this site understands, read from the committed contract. */
async function supportedSchemaVersion(root) {
  const contract = JSON.parse(
    await readFile(path.join(root, "contract/portfolio-snapshot.schema.json"), "utf8"),
  );
  return contract.properties.schemaVersion.const;
}

async function syncLocal(root, pdfDir) {
  const fixtures = path.join(root, "content/case-studies/pdfs");
  const files = (await readdir(fixtures)).filter((f) => f.endsWith(".pdf"));
  for (const file of files) await copyFile(path.join(fixtures, file), path.join(pdfDir, file));
  return { source: "local", pdfs: files.length };
}

async function syncCanvas(root, pdfDir, env, fetchImpl) {
  const base = env.CANVAS_API_URL?.replace(/\/+$/, "");
  const key = env.PORTFOLIO_READ_KEY;
  if (!base || !key)
    throw new SyncError("canvas source needs CANVAS_API_URL and PORTFOLIO_READ_KEY");

  const get = async (url) => {
    let response;
    try {
      response = await fetchImpl(url, {
        headers: { "x-api-key": key },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch (error) {
      throw new SyncError(`Canvas is unreachable (${url}): ${error.message}`);
    }
    if (!response.ok) throw new SyncError(`Canvas returned ${response.status} for ${url}`);
    return response;
  };

  const snapshot = await (await get(`${base}/portfolio/published`)).json();
  const version = await supportedSchemaVersion(root);
  if (snapshot?.schemaVersion !== version) {
    throw new SyncError(
      `Unsupported snapshot schemaVersion ${snapshot?.schemaVersion} (this site understands ${version})`,
    );
  }
  if (!Array.isArray(snapshot.caseStudies) || !Array.isArray(snapshot.audiences)) {
    throw new SyncError("Snapshot is missing caseStudies or audiences");
  }

  for (const { slug } of snapshot.caseStudies) {
    const expected = snapshot.pdfs?.[slug]?.sha256;
    if (!expected) throw new SyncError(`Case study "${slug}" has no PDF in the snapshot`);
    const response = await get(`${base}/portfolio/published/pdfs/${encodeURIComponent(slug)}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    const actual = sha256(buffer);
    if (actual !== expected) {
      throw new SyncError(`PDF for "${slug}" failed its integrity check (sha256 ${actual})`);
    }
    await writeFile(path.join(pdfDir, `${slug}.pdf`), buffer);
  }

  const generatedDir = path.join(root, "content/generated");
  await mkdir(generatedDir, { recursive: true });
  const { schemaVersion, publishedAt, caseStudies, audiences } = snapshot;
  await writeFile(
    path.join(generatedDir, "portfolio.json"),
    JSON.stringify({ schemaVersion, publishedAt, caseStudies, audiences }, null, 2) + "\n",
  );
  return { source: "canvas", pdfs: snapshot.caseStudies.length, publishedAt };
}

/**
 * Sync content for the configured source. Exported for tests.
 * @param {{
 *   env?: Record<string, string | undefined>,
 *   fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>,
 *   root?: string,
 * }} [options]
 */
export async function syncContent({ env = process.env, fetchImpl = fetch, root = ROOT } = {}) {
  const source = env.PORTFOLIO_CONTENT_SOURCE || "local";
  if (!SOURCES.includes(source)) {
    throw new SyncError(
      `PORTFOLIO_CONTENT_SOURCE must be one of ${SOURCES.join(", ")} (got "${source}")`,
    );
  }
  const pdfDir = path.join(root, "public/case-studies");
  await resetPdfDir(pdfDir);
  return source === "canvas" ? syncCanvas(root, pdfDir, env, fetchImpl) : syncLocal(root, pdfDir);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  syncContent()
    .then((result) => {
      const when = result.publishedAt ? `, published ${result.publishedAt}` : "";
      console.log(`[content] ${result.source}: ${result.pdfs} PDF(s)${when}`);
    })
    .catch((error) => {
      console.error(`[content] sync failed: ${error.message}`);
      process.exit(1);
    });
}
