import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { indexDocument, indexFile } from "../src/index.js";

afterEach(async () => {
  vi.restoreAllMocks();
});

describe("indexDocument", () => {
  let tmp: string;
  afterEach(async () => {
    if (tmp) {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it("runs without embed", async () => {
    const r = await indexDocument("# T\n\nHello.", "d");
    expect(r.chunks.length).toBeGreaterThan(0);
    expect(r.tree.length).toBeGreaterThan(0);
    expect(r.chunks[0]!.text.length).toBeGreaterThan(0);
  });

  it("hides text when includeChunkText is false and no embed", async () => {
    const r = await indexDocument("Hello world doc.", "d", {
      includeChunkText: false,
    });
    expect(r.chunks[0]!.text).toBe("");
  });

  it("caches embedding on second run with mock embed", async () => {
    tmp = await mkdtemp(join(tmpdir(), "rw-"));
    const cacheDir = join(tmp, "cache");
    const embed = vi.fn().mockImplementation(async (texts: string[]) =>
      texts.map((_, i) => [i, i + 1] as number[])
    );
    const md = "# A\n\nBody text " + "x".repeat(50);
    const o = { cache: true, cacheDir, embed };
    await indexDocument(md, "d1", o);
    await indexDocument(md, "d1", o);
    const second = await indexDocument(md, "d1", o);
    expect(second.stats.chunksFromCache).toBeGreaterThan(0);
    const callsAfterWarmed = embed.mock.calls.length;
    await indexDocument("# A\n\n" + "y".repeat(4000), "d1", o);
    expect(embed.mock.calls.length).toBeGreaterThan(callsAfterWarmed);
  });

  it("calls indexFile and reads from disk", async () => {
    const dir = await mkdtemp(join(tmpdir(), "rw-f-"));
    const p = join(dir, "sample.md");
    await writeFile(p, "# T\n\nHi.", "utf-8");
    const r = await indexFile(p);
    expect(r.docName).toBe("sample");
    await rm(dir, { recursive: true, force: true });
  });

  it("optional generateSummaries with llm", async () => {
    const r = await indexDocument("# Longish\n\n" + "p ".repeat(200), "d", {
      generateSummaries: true,
      includeTree: true,
      summaryMaxTokens: 2,
      llm: async () => "one-line summary",
    });
    const node = r.tree[0]!;
    expect(node.summary).toBeDefined();
  });
});
