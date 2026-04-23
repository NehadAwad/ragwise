import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, describe, expect, it } from "vitest";
import { hashChunk } from "../src/cache/hasher.js";
import { ChunkCache } from "../src/cache/store.js";

describe("hasher", () => {
  it("is stable for same text", () => {
    expect(hashChunk("a")).toBe(hashChunk("a"));
    expect(hashChunk("a")).not.toBe(hashChunk("b"));
  });
});

describe("ChunkCache", () => {
  let dir: string;
  afterEach(async () => {
    if (dir) {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("persists get and set", async () => {
    dir = await mkdtemp(join(tmpdir(), "ragwise-"));
    const c = new ChunkCache(dir, "doc1");
    const h = "abc123";
    expect(await c.get(h)).toBeNull();
    const emb = [0.1, 0.2];
    await c.set(h, emb);
    const c2 = new ChunkCache(dir, "doc1");
    const e = await c2.get(h);
    expect(e?.embedding).toEqual(emb);
  });
});
