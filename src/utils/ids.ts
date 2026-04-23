import { createHash } from "crypto";

const slug = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48) || "doc";

export function generateDocId(docName: string): string {
  const base = slug(docName);
  const h = createHash("sha256").update(docName).digest("hex").slice(0, 8);
  return `${base}_${h}`;
}

export function sectionIdFor(docId: string, index: number): string {
  return `${docId}_section_${String(index).padStart(3, "0")}`;
}

export function chunkIdFor(
  docId: string,
  globalChunkIndex: number
): string {
  return `${docId}_chunk_${String(globalChunkIndex).padStart(3, "0")}`;
}
