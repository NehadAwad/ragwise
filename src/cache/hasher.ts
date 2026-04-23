import { createHash } from "crypto";

export function hashChunk(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
