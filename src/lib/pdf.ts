import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

let workerConfigured = false;

export const pdfWorkerSrc = workerUrl;

export interface PdfTextExtractionOptions {
  maxPages?: number;
  includePageHeaders?: boolean;
}

function cleanPageText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\b(page|стр\.?|страница|бет)\s*\d+(\s*(\/|of|из)\s*\d+)?\b/gi, ' ')
    .replace(/\b\d{1,3}\b(?=\s*$)/g, ' ')
    .trim();
}

export function cleanExtractedPdfText(raw: string): string {
  return raw
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/gi, ' ')
    .replace(/\b(page|стр\.?|страница|бет)\s*\d+(\s*(\/|of|из)\s*\d+)?\b/gi, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function ensurePdfWorkerConfigured(): void {
  if (workerConfigured) return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;
  workerConfigured = true;
}

export async function loadPdfDocument(data: ArrayBuffer): Promise<any> {
  ensurePdfWorkerConfigured();
  return pdfjsLib.getDocument({ data }).promise;
}

export async function extractTextFromPdfDocument(
  pdf: any,
  options: PdfTextExtractionOptions = {},
): Promise<string> {
  const { maxPages = 20, includePageHeaders = false } = options;
  const limit = Math.min(pdf.numPages || 0, maxPages);
  const pageChunks: string[] = [];

  for (let i = 1; i <= limit; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = cleanPageText(
        content.items
        .map((item: any) => (typeof item?.str === 'string' ? item.str : ''))
        .join(' ')
      );

      if (!pageText) continue;

      if (includePageHeaders) {
        pageChunks.push(`--- Бет ${i} ---\n${pageText}`);
      } else {
        pageChunks.push(pageText);
      }
    } catch (pageError) {
      console.warn(`PDF page ${i} read error:`, pageError);
    }
  }

  return cleanExtractedPdfText(pageChunks.join('\n\n'));
}

export async function extractTextFromPdfFile(
  file: File,
  options: PdfTextExtractionOptions = {},
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await loadPdfDocument(arrayBuffer);
  return extractTextFromPdfDocument(pdf, options);
}
