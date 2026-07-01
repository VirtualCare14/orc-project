'use client';

import { DocumentType, AadhaarFrontData, AadhaarBackData, ChassisData, RegistrationFormData } from '@/types';
import { parseAadhaarFront, parseAadhaarBack } from '@/utils/aadhaarParser';
import { parseChassisPlate } from '@/utils/chassisParser';
import { performOCR } from './ocr';
import { preprocessImage, ProcessedImage } from '@/utils/imageProcessor';

export interface ExtractionResult {
  type: DocumentType;
  text: string;
  confidence: number;
  data: AadhaarFrontData | AadhaarBackData | ChassisData;
  fieldConfidence: Record<string, number>;
  processedImageUrl?: string;
}

export async function extractFromDocument(
  file: File,
  type: DocumentType,
  onProgress?: (progress: number, status: string) => void,
): Promise<ExtractionResult> {
  onProgress?.(5, 'Preprocessing image...');

  let processed: ProcessedImage;
  try {
    processed = await preprocessImage(file);
  } catch {
    onProgress?.(10, 'Using original image...');
    const dataUrl = URL.createObjectURL(file);
    processed = {
      dataUrl,
      blob: file,
      width: 0,
      height: 0,
    };
  }

  onProgress?.(30, 'Running OCR...');

  const ocrResult = await performOCR(
    processed.blob,
    (p, s) => onProgress?.(30 + Math.round(p * 0.5), s),
  );

  onProgress?.(85, 'Extracting data...');

  let data: AadhaarFrontData | AadhaarBackData | ChassisData;
  let fieldConfidence: Record<string, number>;

  switch (type) {
    case 'aadhaarFront': {
      const parsed = parseAadhaarFront(ocrResult.text);
      data = parsed.data;
      fieldConfidence = parsed.confidence;
      break;
    }
    case 'aadhaarBack': {
      const parsed = parseAadhaarBack(ocrResult.text);
      data = parsed.data;
      fieldConfidence = parsed.confidence;
      break;
    }
    case 'chassisPlate': {
      const parsed = parseChassisPlate(ocrResult.text);
      data = parsed.data;
      fieldConfidence = parsed.confidence;
      break;
    }
    default:
      throw new Error('Unknown document type: ' + type);
  }

  onProgress?.(100, 'Complete');

  return {
    type,
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    data,
    fieldConfidence,
    processedImageUrl: processed.dataUrl,
  };
}

/**
 * Build combined form data from all OCR results
 */
export function buildRegistrationFormData(
  frontResult: ExtractionResult | null,
  backResult: ExtractionResult | null,
  chassisResult: ExtractionResult | null,
): Partial<RegistrationFormData> {
  const front = frontResult?.data as AadhaarFrontData | undefined;
  const back = backResult?.data as AadhaarBackData | undefined;
  const chassis = chassisResult?.data as ChassisData | undefined;

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const defaultDate = dd + '/' + mm + '/' + yyyy;

  const invNum = 'INV-' + yyyy + mm + dd + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');

  return {
    ownerName: front?.name || '',
    fatherName: '',
    dob: front?.dob || '',
    gender: front?.gender || '',
    aadhaarNumber: front?.aadhaarNumber || '',
    address: back?.address || '',
    village: back?.village || '',
    district: back?.district || '',
    state: back?.state || '',
    pin: back?.pinCode || '',
    engineNumber: chassis?.engineNumber || '',
    chassisNumber: chassis?.chassisNumber || '',
    model: chassis?.model || '',
    colour: '',
    year: chassis?.manufacturingDate?.match(/\d{4}/)?.[0] || '',
    invoiceNumber: invNum,
    invoiceDate: defaultDate,
    invoiceAmount: '',
    financeBank: '',
    mobileNumber: '',
    price: '',
    dealership: '',
    rtoOffice: '',
  };
}