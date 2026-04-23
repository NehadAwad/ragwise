import {
  countTokensSync,
  takeFirstTokenWords,
  takeLastTokenWords,
} from "../tokenizer.js";
import type { ChunkDraft } from "../types.js";

export function addOverlap(
  chunks: ChunkDraft[],
  overlapTokens: number
): ChunkDraft[] {
  if (chunks.length === 0 || overlapTokens <= 0) {
    return chunks.map((c) => ({ ...c }));
  }
  return chunks.map((c, i) => {
    let text = c.text;
    let ob = 0;
    let oa = 0;
    if (i > 0) {
      const prefix = takeLastTokenWords(chunks[i - 1]!.text, overlapTokens);
      ob = countTokensSync(prefix);
      if (prefix) {
        text = `${prefix}\n\n${text}`;
      }
    }
    if (i < chunks.length - 1) {
      const suffix = takeFirstTokenWords(chunks[i + 1]!.text, overlapTokens);
      oa = countTokensSync(suffix);
      if (suffix) {
        text = `${text}\n\n${suffix}`;
      }
    }
    return {
      ...c,
      text,
      tokens: countTokensSync(text),
      overlapBefore: ob,
      overlapAfter: oa,
    };
  });
}
