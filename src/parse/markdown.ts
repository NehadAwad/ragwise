import { countTokensSync } from "../tokenizer.js";
import type { Section } from "../types.js";

const ATX = /^(\s*)(#{1,6})\s+(.+?)\s*$/;
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

function isFenceLine(line: string): boolean {
  return FENCE.test(line);
}

export interface ParseMarkdownContext {
  docName?: string;
}

function headerInfo(line: string): { level: number; title: string } | null {
  const m = line.match(ATX);
  if (!m) {
    return null;
  }
  return { level: m[2]!.length, title: m[3]!.trim() };
}

export function parseMarkdown(
  content: string,
  context?: ParseMarkdownContext
): Section[] {
  const lines = content.split(/\n/);
  if (lines.length === 0) {
    return [
      {
        id: "",
        title: context?.docName ?? "Document",
        level: 1,
        text: "",
        tokens: 0,
        startLine: 1,
        endLine: 1,
      },
    ];
  }

  type RawHeader = { level: number; title: string; lineIndex: number };
  const headers: RawHeader[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    if (isFenceLine(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      continue;
    }
    const h = headerInfo(line);
    if (h) {
      headers.push({ ...h, lineIndex: i });
    }
  }

  if (headers.length === 0) {
    return [
      {
        id: "",
        title: context?.docName ?? "Document",
        level: 1,
        text: content.trimEnd(),
        tokens: countTokensSync(content),
        startLine: 1,
        endLine: lines.length,
      },
    ];
  }

  const sections: Omit<Section, "id">[] = [];

  const first = headers[0]!;
  if (first.lineIndex > 0) {
    const preLines = lines.slice(0, first.lineIndex);
    const text = preLines.join("\n").trimEnd();
    if (text.length > 0) {
      sections.push({
        title: "Preamble",
        level: 1,
        text,
        tokens: countTokensSync(text),
        startLine: 1,
        endLine: first.lineIndex,
      });
    }
  }

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i]!;
    const next = headers[i + 1];
    const startLine = h.lineIndex + 2;
    const endLine = next ? next.lineIndex : lines.length;
    const bodyLines = lines.slice(h.lineIndex + 1, endLine);
    const text = bodyLines.join("\n");
    const titleLine = lines[h.lineIndex] ?? "";
    const headerM = titleLine.match(ATX);
    const level = headerM ? headerM[2]!.length : h.level;
    const title = headerM ? headerM[3]!.trim() : h.title;

    sections.push({
      title,
      level,
      text: text.split("\n").join("\n"),
      tokens: countTokensSync(text),
      startLine,
      endLine,
    });
  }

  return sections.map((s) => ({
    ...s,
    id: "",
  }));
}
