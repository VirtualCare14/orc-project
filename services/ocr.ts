'use client';

import Tesseract from 'tesseract.js';

export type OCRProgressCallback = (progress: number, status: string) => void;

export async function performOCR(
  imageData: string | Blob | File | Buffer,
  onProgress?: OCRProgressCallback,
  language = 'eng',
): Promise<{
  text: string;
  confidence: number;
}> {
  const result = await Tesseract.recognize(imageData, language, {});
  
  // Simulate progress since tesseract.js v7 handles logging internally
  if (onProgress) {
    onProgress(100, 'Complete');
  }

  return {
    text: result.data.text,
    confidence: result.data.confidence,
  };
}