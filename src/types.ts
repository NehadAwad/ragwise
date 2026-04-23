export type EmbedFunction = (texts: string[]) => Promise<number[][]>;
export type LLMFunction = (prompt: string) => Promise<string>;

export interface RagwiseOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  minChunkSize?: number;
  embed?: EmbedFunction;
  embedBatchSize?: number;
  llm?: LLMFunction;
  generateSummaries?: boolean;
  summaryMaxTokens?: number;
  cache?: boolean;
  cacheDir?: string;
  includeTree?: boolean;
  includeChunkText?: boolean;
}

export interface Chunk {
  id: string;
  text: string;
  tokens: number;
  embedding?: number[];
  sectionId: string;
  sectionTitle: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  overlapBefore: number;
  overlapAfter: number;
}

export interface TreeNode {
  id: string;
  title: string;
  level: number;
  startLine: number;
  endLine: number;
  summary?: string;
  chunkIds: string[];
  children: TreeNode[];
}

export interface RagwiseResult {
  docId: string;
  docName: string;
  chunks: Chunk[];
  tree: TreeNode[];
  stats: {
    totalChunks: number;
    totalTokens: number;
    chunksFromCache: number;
    chunksEmbedded: number;
    sectionsFound: number;
    processingTimeMs: number;
  };
}

export interface Section {
  id: string;
  title: string;
  level: number;
  text: string;
  tokens: number;
  startLine: number;
  endLine: number;
}

export interface CacheEntry {
  hash: string;
  embedding: number[];
  createdAt: number;
}

export interface RagwiseConfig {
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
  embed?: EmbedFunction;
  embedBatchSize: number;
  llm?: LLMFunction;
  generateSummaries: boolean;
  summaryMaxTokens: number;
  cache: boolean;
  cacheDir: string;
  includeTree: boolean;
  includeChunkText: boolean;
}

export interface ChunkDraft {
  text: string;
  tokens: number;
  sectionId: string;
  sectionTitle: string;
  level: number;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  overlapBefore: number;
  overlapAfter: number;
}
