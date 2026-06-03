/**
 * OCR - Optical Character Recognition
 * Utilities for extracting text from images
 */

import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
  language: string;
}

/**
 * Extract text from image using Tesseract OCR
 */
export const extractTextFromImage = async (
  imageUrl: string,
  language: string = 'kaz'
): Promise<OCRResult> => {
  try {
    const {
      data: { text, confidence },
    } = await Tesseract.recognize(imageUrl, language, {
      logger: (m) => {
        // Optional: log progress
        if (m.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    return {
      text,
      confidence,
      language,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Фото бағалау қатесі (OCR). Басқа фото көрсетіп көріңіз.');
  }
};

/**
 * Extract text from multiple images
 */
export const extractTextFromImages = async (
  imageUrls: string[],
  language: string = 'kaz'
): Promise<OCRResult[]> => {
  const results: OCRResult[] = [];

  for (const url of imageUrls) {
    const result = await extractTextFromImage(url, language);
    results.push(result);
  }

  return results;
};

/**
 * Get supported languages for OCR
 */
export const getSupportedLanguages = () => {
  return {
    kaz: 'Қазақша',
    rus: 'Русский',
    eng: 'English',
    ara: 'العربية',
  };
};
