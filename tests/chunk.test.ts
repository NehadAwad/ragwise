import { describe, expect, it } from "vitest";
import { addOverlap } from "../src/chunk/overlap.js";
import { chunkSection } from "../src/chunk/splitter.js";
import { countTokensSync } from "../src/tokenizer.js";
import type { ChunkDraft, Section } from "../src/types.js";

function sec(text: string): Section {
  return {
    id: "s1",
    title: "S",
    level: 1,
    text,
    tokens: countTokensSync(text),
    startLine: 1,
    endLine: 10,
  };
}

describe("chunkSection", () => {
  it("returns a single chunk when under chunkSize", () => {
    const s = sec("short text");
    const c = chunkSection(s, { chunkSize: 512, minChunkSize: 10 });
    expect(c).toHaveLength(1);
  });

  it("splits oversized paragraph by hard token cut", () => {
    const word = "w ";
    const text = word.repeat(2000);
    const s = sec(text);
    const c = chunkSection(s, { chunkSize: 200, minChunkSize: 50 });
    expect(c.length).toBeGreaterThan(1);
    for (const ch of c) {
      expect(ch.text.length).toBeGreaterThan(0);
    }
  });
});

function chunkDraft(text: string): ChunkDraft {
  return {
    text,
    tokens: countTokensSync(text),
    sectionId: "a",
    sectionTitle: "A",
    level: 1,
    chunkIndex: 0,
    startLine: 1,
    endLine: 1,
    overlapBefore: 0,
    overlapAfter: 0,
  };
}

describe("addOverlap", () => {
  it("leaves first chunk with zero overlapBefore", () => {
    const chunks = [chunkDraft("alpha beta gamma delta"), chunkDraft("one two three four")];
    const o = addOverlap(chunks, 4);
    expect(o[0]!.overlapBefore).toBe(0);
    expect(o[0]!.text.length).toBeGreaterThanOrEqual(chunks[0]!.text.length);
  });

  it("no-ops for empty overlap", () => {
    const c = [chunkDraft("only")];
    const o = addOverlap(c, 0);
    expect(o[0]!.text).toBe(c[0]!.text);
  });
});
