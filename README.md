# ragwise

[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/ragwise?logo=npm&logoColor=white)](https://www.npmjs.com/package/ragwise)

Smart Markdown chunking for RAG pipelines. Converts documents into overlapping chunks with optional embeddings, a hierarchical heading tree, and hash-based caching.

## Features

- **Smart Chunking** - Paragraph and sentence-aware splits with configurable size and overlap
- **Section Boundaries** - Overlap stays within sections (never crosses headings)
- **Heading Tree** - Hierarchical outline from ATX headers for navigation UIs
- **Embedding Support** - Bring your own `embed` function; batched and cache-aware
- **Hash-based Cache** - Skip re-embedding unchanged content
- **Zero Runtime Deps** - Only Node.js built-ins (`fs`, `crypto`, `path`)
- **Optional tiktoken** - Accurate OpenAI token counts via optional peer dependency

## Installation

```bash
npm install ragwise
```

For accurate OpenAI token counts (optional):

```bash
npm install tiktoken
```

## Quick Start

```typescript
import { indexDocument } from "ragwise";
import OpenAI from "openai";

const openai = new OpenAI();

const embed = async (texts: string[]) => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });
  return response.data.map((d) => d.embedding);
};

const markdown = `
# User Guide
Welcome to the product.

## Getting Started
Follow these steps to begin...

## Advanced Features
Power user features here.
`;

const result = await indexDocument(markdown, "user-guide", {
  chunkSize: 256,
  chunkOverlap: 32,
  embed,
  cache: true,
  cacheDir: "./.doc-cache",
});

console.log(`Total chunks: ${result.stats.totalChunks}`);
console.log(`From cache: ${result.stats.chunksFromCache}`);
console.log(`Newly embedded: ${result.stats.chunksEmbedded}`);
```

## Output

- **`result.chunks`** - Array of chunks with text, embeddings, token counts, and line ranges
- **`result.tree`** - Hierarchical `TreeNode[]` for navigation (empty if `includeTree: false`)
- **`result.stats`** - Processing statistics (chunks, tokens, cache hits, timing)

## API

### `indexDocument(content, docName, options?)`

Process a Markdown string.

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Raw Markdown content |
| `docName` | `string` | Logical document name (used in IDs and cache) |
| `options` | `RagwiseOptions` | Configuration options |

### `indexFile(filePath, options?)`

Read and process a Markdown file.

```typescript
import { indexFile } from "ragwise";

const result = await indexFile("/path/to/doc.md", { embed });
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chunkSize` | `number` | `512` | Target max tokens per chunk |
| `chunkOverlap` | `number` | `64` | Overlap tokens with adjacent chunks |
| `minChunkSize` | `number` | `100` | Minimum chunk size when splitting |
| `embed` | `function` | — | `async (texts: string[]) => number[][]` |
| `embedBatchSize` | `number` | `100` | Chunks per embed call |
| `cache` | `boolean` | `true` | Enable disk cache for embeddings |
| `cacheDir` | `string` | `".ragwise-cache"` | Cache directory path |
| `includeTree` | `boolean` | `true` | Include heading tree in output |
| `includeChunkText` | `boolean` | `true` | Include text in chunk objects |
| `generateSummaries` | `boolean` | `false` | Generate section summaries |
| `summaryMaxTokens` | `number` | `200` | Min tokens to trigger summary |
| `llm` | `function` | — | LLM function for summaries |

### Using tiktoken

For accurate OpenAI token counts:

```typescript
import { initTiktoken, indexDocument } from "ragwise";

await initTiktoken(); // Load tiktoken (requires peer dependency)

const result = await indexDocument(markdown, "doc-name", options);
```

## Types

```typescript
interface Chunk {
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

interface TreeNode {
  id: string;
  title: string;
  level: number;
  startLine: number;
  endLine: number;
  summary?: string;
  chunkIds: string[];
  children: TreeNode[];
}

interface RagwiseResult {
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
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## License

[MIT](LICENSE)
