import { hashChunk } from "../cache/hasher.js";
import { ChunkCache } from "../cache/store.js";
import type { Chunk, ChunkDraft, EmbedFunction } from "../types.js";

export async function batchEmbed(
  drafts: ChunkDraft[],
  cache: ChunkCache | null,
  embed: EmbedFunction,
  batchSize: number
): Promise<{
  chunks: Chunk[];
  fromCache: number;
  embedded: number;
}> {
  const embeddingFor: (number[] | undefined)[] = new Array(drafts.length);
  let fromCache = 0;
  const needIndices: number[] = [];

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i]!;
    const h = hashChunk(d.text);
    if (cache) {
      const c = await cache.get(h);
      if (c) {
        embeddingFor[i] = c.embedding;
        fromCache += 1;
        continue;
      }
    }
    needIndices.push(i);
  }

  let embedded = 0;
  for (let o = 0; o < needIndices.length; o += batchSize) {
    const batch = needIndices.slice(o, o + batchSize);
    const texts = batch.map((i) => drafts[i]!.text);
    const vecs = await embed(texts);
    for (let j = 0; j < batch.length; j++) {
      const idx = batch[j]!;
      const h = hashChunk(drafts[idx]!.text);
      if (cache) {
        await cache.set(h, vecs[j]!);
      }
      embeddingFor[idx] = vecs[j]!;
      embedded += 1;
    }
  }

  const chunks: Chunk[] = drafts.map((d, i) => ({
    id: "",
    text: d.text,
    tokens: d.tokens,
    embedding: embeddingFor[i]!,
    sectionId: d.sectionId,
    sectionTitle: d.sectionTitle,
    chunkIndex: d.chunkIndex,
    startLine: d.startLine,
    endLine: d.endLine,
    overlapBefore: d.overlapBefore,
    overlapAfter: d.overlapAfter,
  }));

  return { chunks, fromCache, embedded };
}

export function toChunkWithoutEmbedding(
  d: ChunkDraft,
  id: string,
  includeText: boolean
): Chunk {
  return {
    id,
    text: includeText ? d.text : "",
    tokens: d.tokens,
    sectionId: d.sectionId,
    sectionTitle: d.sectionTitle,
    chunkIndex: d.chunkIndex,
    startLine: d.startLine,
    endLine: d.endLine,
    overlapBefore: d.overlapBefore,
    overlapAfter: d.overlapAfter,
  };
}
