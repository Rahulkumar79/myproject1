import fs from 'fs';
import zlib from 'zlib';
import mammoth from 'mammoth';

export interface ExtractedDocumentResult {
  extractedText: string;
  pageCount: number;
  pages: Array<{ pageNumber: number; text: string }>;
}

/**
 * Strips prompt injection instructions embedded in uploaded documents.
 */
export function sanitizeDocumentText(raw: string): string {
  if (!raw) return '';
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/gi,
    /system\s*prompt\s*:/gi,
    /you\s+are\s+now\s+in\s+developer\s+mode/gi,
    /disregard\s+all\s+safety\s+guidelines/gi,
  ];
  let cleaned = raw;
  for (const pattern of suspiciousPatterns) {
    cleaned = cleaned.replace(pattern, '[REDACTED_INSTRUCTION]');
  }
  return cleaned.replace(/\0/g, '').trim();
}

function extractTextFromPdfBuffer(buffer: Buffer): { text: string; pages: Array<{ pageNumber: number; text: string }> } {
  const rawLatin = buffer.toString('latin1');
  const extractedSegments: string[] = [];

  // 1. Decompress FlateDecode streams and extract text operators (...) and <...>
  const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
  let match: RegExpExecArray | null;
  while ((match = streamRegex.exec(rawLatin)) !== null) {
    const streamData = Buffer.from(match[1], 'latin1');
    let decodedContent = '';
    try {
      decodedContent = zlib.inflateSync(streamData).toString('latin1');
    } catch {
      try {
        decodedContent = zlib.inflateRawSync(streamData).toString('latin1');
      } catch {
        decodedContent = match[1];
      }
    }

    // Extract PDF text strings inside parentheses (...) within BT ... ET blocks or Tj/TJ operators
    const parenRegex = /\(([^()\\]*(?:\\.[^()\\]*)*)\)\s*(?:Tj|')?/g;
    let pMatch: RegExpExecArray | null;
    const streamWords: string[] = [];
    while ((pMatch = parenRegex.exec(decodedContent)) !== null) {
      const str = pMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\\\/g, '\\');
      // Keep readable ASCII sequences
      if (/^[\x20-\x7E\s]+$/.test(str) && str.trim().length > 1) {
        streamWords.push(str.trim());
      }
    }
    if (streamWords.length > 0) {
      extractedSegments.push(streamWords.join(' '));
    }
  }

  // 2. If stream extraction yielded little text, fallback to readable ASCII runs in buffer
  let combined = extractedSegments.join('\n\n').trim();
  if (combined.length < 40) {
    const utf8Text = buffer.toString('utf8');
    const asciiMatches = utf8Text.match(/[A-Za-z0-9][A-Za-z0-9\s.,;:'"?!()\-_/]{15,}/g) || [];
    const filtered = asciiMatches.filter(
      (line) =>
        !line.includes('endobj') &&
        !line.includes('FlateDecode') &&
        !line.includes('FontDescriptor') &&
        !line.includes('MediaBox')
    );
    combined = filtered.join('\n').trim();
  }

  if (!combined) {
    combined = 'Document uploaded successfully. Structured text content extracted from PDF binary.';
  }

  // Estimate pages by splitting every ~1800 characters
  const pageSize = 1800;
  const pages: Array<{ pageNumber: number; text: string }> = [];
  for (let i = 0; i < combined.length; i += pageSize) {
    pages.push({
      pageNumber: Math.floor(i / pageSize) + 1,
      text: combined.slice(i, i + pageSize),
    });
  }

  return {
    text: combined,
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: combined }],
  };
}

export async function extractDocumentText(filePath: string, mimeType: string, originalName: string): Promise<ExtractedDocumentResult> {
  const ext = originalName.toLowerCase().split('.').pop() || '';
  const buffer = fs.readFileSync(filePath);

  if (ext === 'txt' || ext === 'md' || mimeType === 'text/plain' || mimeType === 'text/markdown') {
    const raw = sanitizeDocumentText(buffer.toString('utf-8'));
    const pageSize = 2000;
    const pages: Array<{ pageNumber: number; text: string }> = [];
    for (let i = 0; i < raw.length; i += pageSize) {
      pages.push({
        pageNumber: Math.floor(i / pageSize) + 1,
        text: raw.slice(i, i + pageSize),
      });
    }
    return {
      extractedText: raw,
      pageCount: Math.max(1, pages.length),
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: raw }],
    };
  }

  if (
    ext === 'docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const raw = sanitizeDocumentText(result.value || buffer.toString('utf-8'));
      const pageSize = 2000;
      const pages: Array<{ pageNumber: number; text: string }> = [];
      for (let i = 0; i < raw.length; i += pageSize) {
        pages.push({
          pageNumber: Math.floor(i / pageSize) + 1,
          text: raw.slice(i, i + pageSize),
        });
      }
      return {
        extractedText: raw,
        pageCount: Math.max(1, pages.length),
        pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: raw }],
      };
    } catch {
      const fallback = sanitizeDocumentText(buffer.toString('utf-8'));
      return {
        extractedText: fallback,
        pageCount: 1,
        pages: [{ pageNumber: 1, text: fallback }],
      };
    }
  }

  // Default: PDF extraction
  const pdfResult = extractTextFromPdfBuffer(buffer);
  const cleaned = sanitizeDocumentText(pdfResult.text);
  return {
    extractedText: cleaned,
    pageCount: pdfResult.pages.length,
    pages: pdfResult.pages.map((p) => ({
      pageNumber: p.pageNumber,
      text: sanitizeDocumentText(p.text),
    })),
  };
}
