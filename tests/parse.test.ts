import { describe, expect, it } from "vitest";
import { buildTree, parseMarkdown } from "../src/parse/index.js";
import { countTokens, countTokensSync } from "../src/tokenizer.js";

describe("parseMarkdown", () => {
  it("returns one section for document with no ATX headers", () => {
    const md = "Just plain text.\nNo header.";
    const s = parseMarkdown(md, { docName: "x" });
    expect(s).toHaveLength(1);
    expect(s[0]!.title).toBe("x");
    expect(s[0]!.text).toContain("Just plain");
  });

  it("skips headers inside fenced code blocks", () => {
    const md = [
      "# Real Title",
      "",
      "```",
      "# Fake in code",
      "```",
      "",
      "Body",
    ].join("\n");
    const s = parseMarkdown(md);
    const hTitles = s.filter((x) => x.title !== "Preamble").map((x) => x.title);
    expect(hTitles).toEqual(["Real Title"]);
  });

  it("emits Preamble for content before first header", () => {
    const md = ["intro line", "", "# A", "body a"].join("\n");
    const s = parseMarkdown(md);
    expect(s.some((x) => x.title === "Preamble")).toBe(true);
    const pre = s.find((x) => x.title === "Preamble");
    expect(pre?.text).toContain("intro");
  });
});

describe("buildTree", () => {
  it("nests by level", () => {
    const sections = [
      {
        id: "1",
        title: "A",
        level: 1,
        text: "",
        tokens: 0,
        startLine: 1,
        endLine: 1,
      },
      {
        id: "2",
        title: "B",
        level: 2,
        text: "",
        tokens: 0,
        startLine: 2,
        endLine: 2,
      },
    ];
    const t = buildTree(sections);
    expect(t).toHaveLength(1);
    expect(t[0]!.title).toBe("A");
    expect(t[0]!.children).toHaveLength(1);
    expect(t[0]!.children[0]!.title).toBe("B");
  });
});

describe("countTokens", () => {
  it("returns positive for non-empty", () => {
    expect(countTokens("hello world")).toBeGreaterThan(0);
  });

  it("countTokens matches countTokensSync", () => {
    expect(countTokensSync("a b c")).toBe(countTokens("a b c"));
  });
});
