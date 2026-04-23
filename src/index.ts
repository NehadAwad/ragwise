import { readFile } from "fs/promises";
import { basename, extname } from "path";
import { resolveConfig } from "./config.js";
import { batchEmbed, toChunkWithoutEmbedding } from "./embed/batcher.js";
import { addOverlap } from "./chunk/overlap.js";
import { chunkSection } from "./chunk/splitter.js";
import { buildTree, parseMarkdown } from "./parse/index.js";
import { ChunkCache } from "./cache/store.js";
import type {
  Chunk,
  ChunkDraft,
  RagwiseOptions,
  RagwiseResult,
  Section,
  TreeNode,
} from "./types.js";
import { chunkIdFor, generateDocId, sectionIdFor } from "./utils/ids.js";

function assignSectionIds(sections: Section[], docId: string): void {
  for (let i = 0; i < sections.length; i++) {
    sections[i]!.id = sectionIdFor(docId, i);
  }
}

function linkChunksToTree(tree: TreeNode[], chunks: Chunk[]): void {
  const bySection = new Map<string, Chunk[]>();
  for (const c of chunks) {
    const list = bySection.get(c.sectionId) ?? [];
    list.push(c);
    bySection.set(c.sectionId, list);
  }
  for (const list of bySection.values()) {
    list.sort((a, b) => a.chunkIndex - b.chunkIndex);
  }
  function visit(nodes: TreeNode[]) {
    for (const n of nodes) {
      n.chunkIds = (bySection.get(n.id) ?? []).map((c) => c.id);
      visit(n.children);
    }
  }
  visit(tree);
}

async function generateSummaries(
  tree: TreeNode[],
  sections: Section[],
  llm: (prompt: string) => Promise<string>,
  summaryMaxTokens: number
): Promise<void> {
  const byId = new Map(sections.map((s) => [s.id, s] as [string, Section]));
  async function visit(nodes: TreeNode[]) {
    for (const n of nodes) {
      const sec = byId.get(n.id);
      if (sec) {
        if (sec.tokens < summaryMaxTokens) {
          n.summary = undefined;
        } else {
          const body = sec.text.length > 8000 ? sec.text.slice(0, 8000) : sec.text;
          n.summary = (
            await llm(
              `Summarize the following section in 1-3 short sentences. Title: ${n.title}\n\n${body}`
            )
          ).trim();
        }
      }
      if (n.children.length) {
        await visit(n.children);
      }
    }
  }
  await visit(tree);
}

function assignChunkIds(
  chunks: Chunk[],
  docId: string
): void {
  for (let i = 0; i < chunks.length; i++) {
    chunks[i]!.id = chunkIdFor(docId, i);
  }
}

function relinkChunkIndicesInOrder(allDrafts: ChunkDraft[]): void {
  const bySec = new Map<string, ChunkDraft[]>();
  for (const d of allDrafts) {
    const list = bySec.get(d.sectionId) ?? [];
    list.push(d);
    bySec.set(d.sectionId, list);
  }
  for (const list of bySec.values()) {
    list.forEach((d, i) => {
      d.chunkIndex = i;
    });
  }
}

export async function indexDocument(
  content: string,
  docName: string,
  options?: Partial<RagwiseOptions>
): Promise<RagwiseResult> {
  const config = resolveConfig(options);
  const start = Date.now();

  const docId = generateDocId(docName);
  const sections = parseMarkdown(content, { docName });
  assignSectionIds(sections, docId);

  const workTree = buildTree(sections);

  const allDrafts: ChunkDraft[] = [];
  for (const section of sections) {
    const drafts = chunkSection(section, {
      chunkSize: config.chunkSize,
      minChunkSize: config.minChunkSize,
    });
    const overlapped = addOverlap(drafts, config.chunkOverlap);
    allDrafts.push(...overlapped);
  }

  relinkChunkIndicesInOrder(allDrafts);

  let finalChunks: Chunk[];
  let fromCache = 0;
  let embedded = 0;

  if (config.embed) {
    const cache = config.cache ? new ChunkCache(config.cacheDir, docId) : null;
    const r = await batchEmbed(
      allDrafts,
      cache,
      config.embed,
      config.embedBatchSize
    );
    finalChunks = r.chunks;
    fromCache = r.fromCache;
    embedded = r.embedded;
  } else {
    finalChunks = allDrafts.map((d, i) =>
      toChunkWithoutEmbedding(d, "", config.includeChunkText)
    );
  }

  assignChunkIds(finalChunks, docId);
  if (!config.includeChunkText) {
    for (const c of finalChunks) {
      c.text = "";
    }
  }

  linkChunksToTree(workTree, finalChunks);

  if (config.generateSummaries && config.llm) {
    await generateSummaries(
      workTree,
      sections,
      config.llm,
      config.summaryMaxTokens
    );
  }

  return {
    docId,
    docName,
    chunks: finalChunks,
    tree: config.includeTree ? workTree : [],
    stats: {
      totalChunks: finalChunks.length,
      totalTokens: finalChunks.reduce((s, c) => s + c.tokens, 0),
      chunksFromCache: fromCache,
      chunksEmbedded: embedded,
      sectionsFound: sections.length,
      processingTimeMs: Date.now() - start,
    },
  };
}

export async function indexFile(
  filePath: string,
  options?: Partial<RagwiseOptions>
): Promise<RagwiseResult> {
  const content = await readFile(filePath, "utf-8");
  const docName = basename(filePath, extname(filePath));
  return indexDocument(content, docName, options);
}

export type {
  CacheEntry,
  Chunk,
  ChunkDraft,
  EmbedFunction,
  LLMFunction,
  RagwiseConfig,
  RagwiseOptions,
  RagwiseResult,
  Section,
  TreeNode,
} from "./types.js";
export { resolveConfig } from "./config.js";
export { parseMarkdown, buildTree } from "./parse/index.js";
export { hashChunk, ChunkCache } from "./cache/index.js";
export { countTokens, initTiktoken, countTokensSync } from "./tokenizer.js";
export { chunkSection, addOverlap } from "./chunk/index.js";
export { batchEmbed, toChunkWithoutEmbedding } from "./embed/batcher.js";
