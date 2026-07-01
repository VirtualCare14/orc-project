import { ChassisData } from '@/types';
import { REGEX_PATTERNS, extractFirst, cleanText } from './regex';

export function parseChassisPlate(text: string): {
  data: ChassisData;
  confidence: Record<string, number>;
} {
  const cleaned = cleanText(text);
  const upperText = cleaned.toUpperCase();

  // Extract Engine Number
  let engineNumber = extractFirst(REGEX_PATTERNS.ENGINE, upperText);
  if (!engineNumber) {
    engineNumber = extractFirst(REGEX_PATTERNS.ENGINE_ALT, upperText);
  }
  // Fallback: look for patterns like "ENG12345" or "EN12345"
  if (!engineNumber) {
    const engMatch = upperText.match(/(?:ENG|EN)([A-Z0-9]{6,})/);
    if (engMatch) engineNumber = engMatch[0];
  }

  // Extract Chassis Number
  let chassisNumber = extractFirst(REGEX_PATTERNS.CHASSIS, upperText);
  if (!chassisNumber) {
    chassisNumber = extractFirst(REGEX_PATTERNS.CHASSIS_ALT, upperText);
  }
  if (!chassisNumber) {
    chassisNumber = extractFirst(REGEX_PATTERNS.CHASSIS_ATIN, upperText);
  }
  // Fallback: look for long alphanumeric patterns typical of chassis numbers
  if (!chassisNumber) {
    const chassisMatch = upperText.match(/(?:CH|CHS)([A-Z0-9]{6,})/);
    if (chassisMatch) chassisNumber = chassisMatch[0];
  }
  // Another fallback: long mixed alphanumeric string (12-17 chars)
  if (!chassisNumber) {
    const vinMatch = upperText.match(/\b([A-HJ-NPR-Z0-9]{11,17})\b/);
    if (vinMatch) chassisNumber = vinMatch[1];
  }

  // Extract Model
  let model = extractFirst(REGEX_PATTERNS.MODEL, upperText);
  if (!model) {
    // Try to find model number (like "JOHN DEERE 5050D" or "MF 1035" or "Sonalika 745")
    const modelMatch = upperText.match(/\b(MODEL|TRACTOR)[\s:]*(.+?)(?:\n|$)/i);
    if (modelMatch) model = modelMatch[2].trim();
  }
  if (!model) {
    // Look for common tractor model patterns (letters followed by numbers)
    const modelMatch = upperText.match(/\b([A-Z]+\s*\d{3,4}[A-Z]?)\b/);
    if (modelMatch) model = modelMatch[1];
  }

  // Extract Manufacturing Date
  let manufacturingDate = '';
  const mfgMatch = upperText.match(REGEX_PATTERNS.MFG_DATE);
  if (mfgMatch) {
    manufacturingDate = mfgMatch[0].replace(/(MFG|MANUFACTURING|MFR|DATE|DT)[\s:]*/i, '').trim();
  }
  if (!manufacturingDate) {
    // Try month + year pattern (e.g., "JAN 2023" or "January 2023")
    const monthYearMatch = upperText.match(/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s*(\d{4})/i);
    if (monthYearMatch) {
      manufacturingDate = `${monthYearMatch[1]} ${monthYearMatch[2]}`;
    }
  }

  // Extract Max Power / PTO
  let maxPower = extractFirst(REGEX_PATTERNS.MAX_POWER, upperText);
  if (!maxPower) {
    maxPower = extractFirst(REGEX_PATTERNS.MAX_POWER_ALT, upperText);
  }
  if (maxPower) {
    maxPower = maxPower + ' HP';
  }

  const data: ChassisData = {
    model,
    engineNumber,
    chassisNumber,
    manufacturingDate,
    maxPower,
  };

  // Calculate confidence
  const confidence: Record<string, number> = {
    model: model ? (model.length > 3 ? 75 : 50) : 0,
    engineNumber: engineNumber ? (engineNumber.length > 5 ? 85 : 60) : 0,
    chassisNumber: chassisNumber ? (chassisNumber.length > 8 ? 90 : 65) : 0,
    manufacturingDate: manufacturingDate ? 70 : 0,
    maxPower: maxPower ? 80 : 0,
  };

  return { data, confidence };
}