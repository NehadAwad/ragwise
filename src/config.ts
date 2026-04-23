import type { RagwiseConfig, RagwiseOptions } from "./types.js";

const defaults: RagwiseConfig = {
  chunkSize: 512,
  chunkOverlap: 64,
  minChunkSize: 100,
  embedBatchSize: 100,
  generateSummaries: false,
  summaryMaxTokens: 200,
  cache: true,
  cacheDir: ".ragwise-cache",
  includeTree: true,
  includeChunkText: true,
};

export function resolveConfig(options?: Partial<RagwiseOptions>): RagwiseConfig {
  if (!options) {
    return { ...defaults };
  }
  return {
    ...defaults,
    ...options,
    chunkSize: options.chunkSize ?? defaults.chunkSize,
    chunkOverlap: options.chunkOverlap ?? defaults.chunkOverlap,
    minChunkSize: options.minChunkSize ?? defaults.minChunkSize,
    embedBatchSize: options.embedBatchSize ?? defaults.embedBatchSize,
    generateSummaries: options.generateSummaries ?? defaults.generateSummaries,
    summaryMaxTokens: options.summaryMaxTokens ?? defaults.summaryMaxTokens,
    cache: options.cache ?? defaults.cache,
    cacheDir: options.cacheDir ?? defaults.cacheDir,
    includeTree: options.includeTree ?? defaults.includeTree,
    includeChunkText: options.includeChunkText ?? defaults.includeChunkText,
  };
}
