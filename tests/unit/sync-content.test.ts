import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SyncError, syncContent } from "../../scripts/sync-content.mjs";

const repo = process.cwd();
const PDF = Buffer.from("%PDF-1.4\n%%EOF\n");
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const ENV = {
  PORTFOLIO_CONTENT_SOURCE: "canvas",
  CANVAS_API_URL: "https://canvas.test/api/",
  PORTFOLIO_READ_KEY: "k",
};

const snapshot = (overrides: Record<string, unknown> = {}) => ({
  schemaVersion: 1,
  publishedAt: "2026-10-22T00:00:00.000Z",
  caseStudies: [{ slug: "alpha" }],
  audiences: [{ id: "recruiter" }],
  pdfs: { alpha: { sha256: sha(PDF) } },
  ...overrides,
});

/** A fake Canvas API. Records requests and serves the given snapshot and PDFs. */
function fakeCanvas(body: unknown, pdfs: Record<string, Buffer> = { alpha: PDF }) {
  const requests: { url: string; key: string | null }[] = [];
  const fetchImpl = async (url: string, init?: RequestInit) => {
    requests.push({ url, key: new Headers(init?.headers).get("x-api-key") });
    if (url.endsWith("/portfolio/published")) return Response.json(body);
    const slug = url.split("/").pop()!;
    return pdfs[slug]
      ? new Response(new Uint8Array(pdfs[slug]))
      : new Response("nope", { status: 404 });
  };
  return { fetchImpl, requests };
}

let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "sync-content-"));
  await cp(path.join(repo, "contract"), path.join(root, "contract"), { recursive: true });
  await cp(
    path.join(repo, "content/case-studies/pdfs"),
    path.join(root, "content/case-studies/pdfs"),
    {
      recursive: true,
    },
  );
  // A stale file from an earlier build must not survive a sync.
  await mkdir(path.join(root, "public/case-studies"), { recursive: true });
});
afterEach(() => rm(root, { recursive: true, force: true }));

describe("syncContent (local)", () => {
  it("copies the fixture PDFs into public/case-studies", async () => {
    const result = await syncContent({ env: {}, root });
    expect(result).toEqual({ source: "local", pdfs: 2 });
    expect((await readdir(path.join(root, "public/case-studies"))).sort()).toEqual([
      "placeholder-alpha.pdf",
      "placeholder-beta.pdf",
    ]);
  });

  it("rejects an unknown source", async () => {
    await expect(
      syncContent({ env: { PORTFOLIO_CONTENT_SOURCE: "cms" }, root }),
    ).rejects.toBeInstanceOf(SyncError);
  });
});

describe("syncContent (canvas)", () => {
  it("writes the snapshot and integrity-checked PDFs, sending the read key", async () => {
    const { fetchImpl, requests } = fakeCanvas(snapshot());
    const result = await syncContent({ env: ENV, fetchImpl, root });
    expect(result).toMatchObject({ source: "canvas", pdfs: 1 });

    const generated = JSON.parse(
      await readFile(path.join(root, "content/generated/portfolio.json"), "utf8"),
    );
    expect(generated).toEqual({
      schemaVersion: 1,
      publishedAt: "2026-10-22T00:00:00.000Z",
      caseStudies: [{ slug: "alpha" }],
      audiences: [{ id: "recruiter" }],
    });
    expect((await readFile(path.join(root, "public/case-studies/alpha.pdf"))).equals(PDF)).toBe(
      true,
    );
    // Only Canvas PDFs remain: the local fixtures are not mixed in.
    expect(await readdir(path.join(root, "public/case-studies"))).toEqual(["alpha.pdf"]);
    expect(requests.map((r) => r.url)).toEqual([
      "https://canvas.test/api/portfolio/published",
      "https://canvas.test/api/portfolio/published/pdfs/alpha",
    ]);
    expect(requests.every((r) => r.key === "k")).toBe(true);
  });

  it.each<[string, Record<string, string>]>([
    ["no API URL", { ...ENV, CANVAS_API_URL: "" }],
    ["no read key", { ...ENV, PORTFOLIO_READ_KEY: "" }],
  ])("fails with %s", async (_, env) => {
    await expect(
      syncContent({ env, fetchImpl: fakeCanvas(snapshot()).fetchImpl, root }),
    ).rejects.toThrow(/needs CANVAS_API_URL and PORTFOLIO_READ_KEY/);
  });

  it("fails on an unsupported schema version", async () => {
    const { fetchImpl } = fakeCanvas(snapshot({ schemaVersion: 2 }));
    await expect(syncContent({ env: ENV, fetchImpl, root })).rejects.toThrow(/schemaVersion 2/);
  });

  it("fails when a case study has no PDF in the snapshot", async () => {
    const { fetchImpl } = fakeCanvas(snapshot({ pdfs: {} }));
    await expect(syncContent({ env: ENV, fetchImpl, root })).rejects.toThrow(/"alpha" has no PDF/);
  });

  it("fails when a PDF doesn't match its hash", async () => {
    const { fetchImpl } = fakeCanvas(snapshot(), { alpha: Buffer.from("%PDF-tampered") });
    await expect(syncContent({ env: ENV, fetchImpl, root })).rejects.toThrow(/integrity check/);
  });

  it("fails when Canvas answers with an error", async () => {
    const fetchImpl = async () => new Response("down", { status: 503 });
    await expect(syncContent({ env: ENV, fetchImpl, root })).rejects.toThrow(/returned 503/);
  });

  it("fails when Canvas is unreachable", async () => {
    const fetchImpl = async () => {
      throw new Error("ECONNREFUSED");
    };
    await expect(syncContent({ env: ENV, fetchImpl, root })).rejects.toThrow(
      /unreachable.*ECONNREFUSED/,
    );
  });
});
