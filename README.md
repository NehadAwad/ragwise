# ragwise

[![npm version](https://img.shields.io/npm/v/ragwise?logo=npm&logoColor=white)](https://www.npmjs.com/package/ragwise)
[![npm downloads](https://img.shields.io/npm/dm/ragwise?logo=npm&logoColor=white)](https://www.npmjs.com/package/ragwise)
[![Node.js 18+](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Smart Markdown chunking for RAG pipelines.**

`ragwise` converts Markdown documents into structured, overlapping chunks while preserving section boundaries. It also supports hierarchical heading trees, optional embeddings, token counting, section summaries, and hash-based embedding caching.

📦 [View on npm](https://www.npmjs.com/package/ragwise)

---

## Features

- **Smart Chunking** — Paragraph and sentence-aware splitting with configurable chunk size and overlap
- **Section-Aware Overlap** — Chunk overlap stays within sections and never crosses heading boundaries
- **Heading Tree** — Builds a hierarchical document tree from Markdown headings
- **Embedding Support** — Bring your own embedding function
- **Batch Embeddings** — Process embeddings in configurable batches
- **Hash-Based Cache** — Avoid re-embedding unchanged content
- **Optional Summaries** — Generate section summaries using your own LLM function
- **Token Counting** — Built-in token estimation with optional `tiktoken` support
- **Zero Runtime Dependencies** — Core functionality uses only Node.js built-ins
- **TypeScript First** — Fully typed API

## Requirements

- Node.js **18 or later**
- npm, pnpm, or yarn
- TypeScript is optional when consuming the package from JavaScript

## Installation

```bash
npm install ragwise
```

For accurate OpenAI-compatible token counting, optionally install `tiktoken`:

```bash
npm install tiktoken
```

## Quick Start

```typescript
import { indexDocument } from "ragwise";

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
});

console.log(`Total chunks: ${result.stats.totalChunks}`);
console.log(`Total tokens: ${result.stats.totalTokens}`);
console.log(result.chunks);
```

## Using Embeddings

`ragwise` is provider-agnostic. Pass any embedding function that accepts an array of strings and returns an array of number arrays.

For example, using OpenAI:

```bash
npm install openai
```

```typescript
import OpenAI from "openai";
import { indexDocument } from "ragwise";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const embed = async (texts: string[]): Promise<number[][]> => {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((item) => item.embedding);
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
  cacheDir: "./.ragwise-cache",
});

console.log(`Total chunks: ${result.stats.totalChunks}`);
console.log(`From cache: ${result.stats.chunksFromCache}`);
console.log(`Newly embedded: ${result.stats.chunksEmbedded}`);
```

> `ragwise` does not require OpenAI. You can use any embedding provider or your own local embedding implementation.

## Output

`indexDocument()` and `indexFile()` return a `RagwiseResult` object containing:

| Property | Description |
| --- | --- |
| `result.chunks` | Generated chunks with text, token counts, section metadata, line ranges, and optional embeddings |
| `result.tree` | Hierarchical heading tree for navigation and document structure |
| `result.stats` | Processing statistics including chunks, tokens, cache hits, and processing time |
| `result.docId` | Generated document identifier |
| `result.docName` | Logical name supplied for the document |

## API

### `indexDocument(content, docName, options?)`

Processes a Markdown string and returns a structured `RagwiseResult`.

```typescript
import { indexDocument } from "ragwise";

const result = await indexDocument(markdown, "my-document", {
  chunkSize: 512,
  chunkOverlap: 64,
});
```

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `content` | `string` | Raw Markdown content |
| `docName` | `string` | Logical document name used for IDs and caching |
| `options` | `RagwiseOptions` | Optional processing configuration |

### `indexFile(filePath, options?)`

Reads and processes a Markdown file from disk.

```typescript
import { indexFile } from "ragwise";

const result = await indexFile("/path/to/document.md", {
  chunkSize: 512,
  chunkOverlap: 64,
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `chunkSize` | `number` | `512` | Target maximum tokens per chunk |
| `chunkOverlap` | `number` | `64` | Number of overlapping tokens between adjacent chunks |
| `minChunkSize` | `number` | `100` | Minimum chunk size when splitting content |
| `embed` | `function` | — | `async (texts: string[]) => number[][]` |
| `embedBatchSize` | `number` | `100` | Number of chunks sent to the embedding function per batch |
| `cache` | `boolean` | `true` | Enable disk caching for embeddings |
| `cacheDir` | `string` | `".ragwise-cache"` | Directory used for cached data |
| `includeTree` | `boolean` | `true` | Include the hierarchical heading tree |
| `includeChunkText` | `boolean` | `true` | Include source text inside chunk objects |
| `generateSummaries` | `boolean` | `false` | Enable section summary generation |
| `summaryMaxTokens` | `number` | `200` | Maximum token target for generated summaries |
| `llm` | `function` | — | Custom LLM function used for summary generation |

## Using tiktoken

By default, `ragwise` can operate without `tiktoken`.

For more accurate OpenAI-compatible token counts:

```bash
npm install tiktoken
```

Then initialize it before processing documents:

```typescript
import { initTiktoken, indexDocument } from "ragwise";

await initTiktoken();

const result = await indexDocument(markdown, "my-document", {
  chunkSize: 512,
  chunkOverlap: 64,
});
```

## Types

### `Chunk`

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
```

### `TreeNode`

```typescript
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
```

### `RagwiseResult`

```typescript
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

## How It Works

```text
Markdown Document
       │
       ▼
┌─────────────────────┐
│ Parse Headings      │
│ & Sections          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Smart Chunking      │
│ Paragraph/Sentence  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Section-Aware       │
│ Overlap             │
└──────────┬──────────┘
           │
           ├──────────────► Heading Tree
           │
           ▼
┌─────────────────────┐
│ Optional Embeddings │
│ + Hash Cache        │
└──────────┬──────────┘
           │
           ▼
      RagwiseResult
```

## Use Cases

`ragwise` is useful for:

- RAG pipelines
- Vector database ingestion
- Documentation search
- AI knowledge bases
- Semantic search systems
- Markdown documentation indexing
- Retrieval systems
- Document navigation interfaces

## Contributing

Contributions are welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.

## License

Released under the [MIT License](LICENSE).

---

<p align="center">
  <strong>ragwise</strong> — Markdown chunking built for RAG.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ragwise">npm</a>
  ·
  <a href="https://github.com/NehadAwad/ragwise">GitHub</a>
  ·
  <a href="https://github.com/NehadAwad/ragwise/issues">Issues</a>
</p>
