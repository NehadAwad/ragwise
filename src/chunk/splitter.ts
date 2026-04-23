import { countTokensSync } from "../tokenizer.js";
import type { ChunkDraft, Section } from "../types.js";

const SENT_END = /([.!?]+)(\s+|$)/g;

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitSentences(para: string): string[] {
  const out: string[] = [];
  let last = 0;
  for (const m of para.matchAll(new RegExp(SENT_END))) {
    const end = m.index! + m[0].length;
    out.push(para.slice(last, end).trim());
    last = end;
  }
  if (last < para.length) {
    out.push(para.slice(last).trim());
  }
  if (out.length === 0) {
    return [para];
  }
  return out.filter(Boolean);
}

function hardSplitByTokens(
  text: string,
  maxTokens: number,
  minChunkSize: number
): string[] {
  const words = text.split(/(\s+)/);
  const pieces: string[] = [];
  let current = "";
  let curTok = 0;
  for (const w of words) {
    if (!w) {
      continue;
    }
    const wt = countTokensSync(w);
    if (curTok + wt > maxTokens && current.length > 0) {
      if (curTok < minChunkSize) {
        current += w;
        curTok += wt;
        continue;
      }
      pieces.push(current);
      current = w;
      curTok = wt;
    } else {
      current += w;
      curTok += wt;
    }
  }
  if (current.length) {
    pieces.push(current);
  }
  if (pieces.length === 0) {
    return [text];
  }
  return pieces;
}

export function chunkSection(
  section: Section,
  options: { chunkSize: number; minChunkSize: number }
): ChunkDraft[] {
  const { chunkSize, minChunkSize } = options;
  const t = countTokensSync(section.text);

  if (t <= chunkSize) {
    return [
      {
        text: section.text,
        tokens: t,
        sectionId: section.id,
        sectionTitle: section.title,
        level: section.level,
        chunkIndex: 0,
        startLine: section.startLine,
        endLine: section.endLine,
        overlapBefore: 0,
        overlapAfter: 0,
      },
    ];
  }

  const paras = splitParagraphs(section.text);
  const initialPieces: string[] = [];

  for (const p of paras) {
    const pt = countTokensSync(p);
    if (pt > chunkSize) {
      const sents = splitSentences(p);
      const toIter = sents.length > 0 ? sents : [p];
      for (const sent of toIter) {
        const st = countTokensSync(sent);
        if (st > chunkSize) {
          initialPieces.push(
            ...hardSplitByTokens(sent, chunkSize, minChunkSize)
          );
        } else {
          initialPieces.push(sent);
        }
      }
    } else {
      initialPieces.push(p);
    }
  }

  const combined: string[] = [];
  let buffer = "";
  let bufTokens = 0;
  for (const piece of initialPieces) {
    const pt = countTokensSync(piece);
    if (pt > chunkSize) {
      if (buffer.length) {
        combined.push(buffer);
        buffer = "";
        bufTokens = 0;
      }
      combined.push(...hardSplitByTokens(piece, chunkSize, minChunkSize));
      continue;
    }
    if (bufTokens + pt > chunkSize && buffer.length) {
      combined.push(buffer);
      buffer = piece;
      bufTokens = pt;
    } else {
      buffer = buffer ? `${buffer}\n\n${piece}` : piece;
      bufTokens = countTokensSync(buffer);
    }
  }
  if (buffer.length) {
    combined.push(buffer);
  }

  return combined.map((text, idx) => ({
    text,
    tokens: countTokensSync(text),
    sectionId: section.id,
    sectionTitle: section.title,
    level: section.level,
    chunkIndex: idx,
    startLine: section.startLine,
    endLine: section.endLine,
    overlapBefore: 0,
    overlapAfter: 0,
  }));
}
