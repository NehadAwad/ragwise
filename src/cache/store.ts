import { mkdir, readFile, writeFile, unlink, rm } from "fs/promises";
import { dirname, join } from "path";
import type { CacheEntry } from "../types.js";

type CacheFile = Record<string, CacheEntry>;

export class ChunkCache {
  private readonly path: string;
  private map: CacheFile | null = null;

  constructor(
    public readonly cacheDir: string,
    public readonly docId: string
  ) {
    this.path = join(cacheDir, `${docId}.json`);
  }

  private async load(): Promise<CacheFile> {
    if (this.map) {
      return this.map;
    }
    try {
      const raw = await readFile(this.path, "utf-8");
      this.map = JSON.parse(raw) as CacheFile;
      return this.map;
    } catch {
      this.map = {};
      return this.map;
    }
  }

  async get(hash: string): Promise<CacheEntry | null> {
    const m = await this.load();
    const e = m[hash];
    return e ?? null;
  }

  async set(hash: string, embedding: number[]): Promise<void> {
    const m = await this.load();
    m[hash] = {
      hash,
      embedding,
      createdAt: Date.now(),
    };
    this.map = m;
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(m), "utf-8");
  }

  async clear(): Promise<void> {
    this.map = {};
    try {
      await unlink(this.path);
    } catch {
      // ignore
    }
  }
}

export async function clearAllInDir(cacheDir: string): Promise<void> {
  try {
    await rm(cacheDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}
