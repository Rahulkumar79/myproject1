import { GoogleGenAI, Type } from '@google/genai';
import { env, hasValidGeminiKey } from './env.ts';

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!hasValidGeminiKey()) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export const GEMINI_TEXT_MODEL = 'gemini-3.8-flash';
export const GEMINI_EMBEDDING_MODEL = 'gemini-embedding-2-preview';
export { Type };

export function sanitizeProviderError(err: unknown): string {
  if (!err) return 'Unknown AI provider error';
  const raw = err instanceof Error ? err.message : String(err);
  // Strip any accidental key/token parameters or verbose stack traces
  const redacted = raw
    .replace(/key=[A-Za-z0-9_\-]+/gi, 'key=[REDACTED]')
    .replace(/AIza[A-Za-z0-9_\-]{20,}/g, '[REDACTED_API_KEY]');
  if (redacted.includes('429') || redacted.includes('RESOURCE_EXHAUSTED')) {
    return 'rate_limit_429';
  }
  if (redacted.includes('503') || redacted.includes('UNAVAILABLE')) {
    return 'provider_unavailable_503';
  }
  if (redacted.includes('timed out')) {
    return 'provider_timeout';
  }
  return redacted.slice(0, 140);
}

export async function withAiTimeout<T>(promise: Promise<T>, timeoutMs = 15000): Promise<T> {
  let timer: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Gemini request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

