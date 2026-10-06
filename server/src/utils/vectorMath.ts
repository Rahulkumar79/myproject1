export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const len = Math.min(vecA.length, vecB.length);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates a deterministic 128-dimensional semantic hash vector used either as a
 * fast fallback when external embedding calls are unavailable or combined with lexical scoring.
 */
export function computeDeterministicEmbedding(text: string, dimensions = 128): number[] {
  const vec = new Array(dimensions).fill(0);
  const normalized = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (normalized.length === 0) return vec;

  for (const word of normalized) {
    let h1 = 2166136261;
    let h2 = 16777619;
    for (let i = 0; i < word.length; i++) {
      const c = word.charCodeAt(i);
      h1 ^= c;
      h1 = Math.imul(h1, 16777619);
      h2 = (h2 * 31 + c) | 0;
    }
    const idx1 = Math.abs(h1) % dimensions;
    const idx2 = Math.abs(h2) % dimensions;
    vec[idx1] += 1.0;
    vec[idx2] += 0.5;
  }

  const mag = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0));
  if (mag > 0) {
    for (let i = 0; i < dimensions; i++) {
      vec[i] = Number((vec[i] / mag).toFixed(5));
    }
  }
  return vec;
}

export function lexicalOverlapScore(query: string, chunkText: string): number {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'how', 'why',
    'are', 'was', 'were', 'explain', 'describe', 'about', 'into', 'your', 'can',
  ]);
  const qTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  if (qTokens.length === 0) return 0;

  const targetLower = chunkText.toLowerCase();
  let matches = 0;
  for (const token of qTokens) {
    if (targetLower.includes(token)) {
      matches += 1;
    }
  }
  return matches / qTokens.length;
}

export interface TextChunk {
  content: string;
  pageNumber: number;
  chunkIndex: number;
}

export function chunkDocumentText(
  pages: Array<{ pageNumber: number; text: string }>,
  chunkSize = 750,
  overlap = 120
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let globalIndex = 0;

  for (const page of pages) {
    const clean = page.text.replace(/\s+/g, ' ').trim();
    if (!clean) continue;

    let start = 0;
    while (start < clean.length) {
      const end = Math.min(start + chunkSize, clean.length);
      const slice = clean.slice(start, end).trim();
      if (slice.length > 20) {
        chunks.push({
          content: slice,
          pageNumber: page.pageNumber,
          chunkIndex: globalIndex++,
        });
      }
      if (end >= clean.length) break;
      start += chunkSize - overlap;
    }
  }

  return chunks;
}
