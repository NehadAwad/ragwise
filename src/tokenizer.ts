let tiktokenEncode: ((text: string) => number[]) | null = null;

export async function initTiktoken(): Promise<boolean> {
  if (tiktokenEncode) {
    return true;
  }
  try {
    // @ts-expect-error — optional peer dependency; not installed in all environments
    const mod = await import("tiktoken");
    const enc = mod.encoding_for_model("gpt-4");
    tiktokenEncode = (text: string) => enc.encode(text);
    return true;
  } catch {
    return false;
  }
}

function countTokensHeuristic(text: string): number {
  const words = text.split(/\s+/).filter(Boolean);
  return Math.ceil(words.length * 1.3);
}

export function countTokens(text: string): number {
  return countTokensSync(text);
}

export function countTokensSync(text: string): number {
  if (tiktokenEncode) {
    return tiktokenEncode(text).length;
  }
  return countTokensHeuristic(text);
}

export function takeLastTokenWords(text: string, targetTokens: number): string {
  if (targetTokens <= 0 || !text.trim()) {
    return "";
  }
  const words = text.split(/(\s+)/);
  const out: string[] = [];
  let t = 0;
  for (let i = words.length - 1; i >= 0; i--) {
    const part = words[i];
    if (!part) {
      continue;
    }
    t += countTokensSync(part);
    out.unshift(part);
    if (t >= targetTokens) {
      break;
    }
  }
  return out.join("").trimStart();
}

export function takeFirstTokenWords(text: string, targetTokens: number): string {
  if (targetTokens <= 0 || !text.trim()) {
    return "";
  }
  const words = text.split(/(\s+)/);
  const out: string[] = [];
  let t = 0;
  for (const part of words) {
    if (!part) {
      continue;
    }
    t += countTokensSync(part);
    out.push(part);
    if (t >= targetTokens) {
      break;
    }
  }
  return out.join("").trimEnd();
}
