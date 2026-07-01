export const REGEX_PATTERNS = {
  // Aadhaar Number: 4 digits space 4 digits space 4 digits
  AADHAAR: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,

  // DOB: DD/MM/YYYY or DD-MM-YYYY
  DOB: /\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/g,

  // Gender
  GENDER: /\b(Male|Female|महिला|पुरुष)\b/gi,

  // PIN Code: 6 digits
  PIN: /\b\d{6}\b/g,

  // Engine Number patterns
  ENGINE: /(?:ENGINE\s*(?:NO|NUMBER|SERIAL|#|:)?[\s:]*)([A-Z0-9\-]+)/gi,
  ENGINE_ALT: /(?:ENG\s*NO[\s:]*)([A-Z0-9\-]+)/gi,

  // Chassis Number patterns
  CHASSIS: /(?:CHASSIS\s*(?:NO|NUMBER|SERIAL|#|:)?[\s:]*)([A-Z0-9\-]+)/gi,
  CHASSIS_ALT: /(?:SERIAL\s*(?:NO|NUMBER|#|:)?[\s:]*)([A-Z0-9\-]+)/gi,
  CHASSIS_ATIN: /(?:ATIN[\s:]*)([A-Z0-9\-]+)/gi,

  // Invoice Number
  INVOICE_NO: /(?:INVOICE\s*(?:NO|NUMBER|#|:)?[\s:]*)([A-Z0-9\-/]+)/gi,

  // Invoice Date
  INVOICE_DATE: /(?:INVOICE\s*DATE[\s:]*)(\d{2}[\/\-]\d{2}[\/\-]\d{4})/gi,
  DATE_GENERAL: /(?:DATE[\s:]*)(\d{2}[\/\-]\d{2}[\/\-]\d{4})/gi,

  // Model
  MODEL: /(?:MODEL[\s:]*)([A-Z0-9\-]+)/gi,

  // Colour / Color
  COLOUR: /(?:COLOUR|COLOR)[\s:]*([A-Z\s]+)/gi,

  // Year
  YEAR: /\b(20\d{2})\b/g,

  // Amount
  AMOUNT: /(?:INVOICE\s*AMOUNT|AMOUNT|TOTAL)[\s:]*(?:Rs\.?|₹|INR)?\s*([0-9,]+\.?\d*)/gi,

  // Finance Bank
  FINANCE: /(?:FINANCE|BANK|FINANCED\s*(?:BY|THROUGH)?)[\s:]*(.+?)(?:\n|$)/gi,

  // Customer Name
  CUSTOMER: /(?:CUSTOMER\s*(?:NAME)?|MESSRS)[\s:]*(.+?)(?:\n|$)/gi,
  FATHER: /(?:FATHER[']?S?\s*NAME|S\/O|D\/O|C\/O)[\s:]*(.+?)(?:\n|$)/gi,

  // Address patterns
  VILLAGE: /(?:VILL[AGE]*)[\s:]*([A-Z\s]+)/gi,
  DISTRICT: /(?:DIST[RICT]*)[\s:]*([A-Z\s]+)/gi,
  STATE: /(?:STATE)[\s:]*([A-Z\s]+)/gi,
  POST_OFFICE: /(?:POST\s*(?:OFFICE)?)[\s:]*([A-Z\s]+)/gi,
  HOUSE: /(?:HOUSE\s*(?:NO|NUMBER|#)?)[\s:]*([A-Z0-9\-/]+)/gi,

  // Manufacturing Date
  MFG_DATE: /(?:MFG|MANUFACTURING|MFR)[\s]*(?:DATE|DT|:)?[\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4}|\w+\s*\d{4})/gi,
  MFG_MONTH: /(?:MFG|MANUFACTURING)[\s]*(?:MONTH|:)?[\s]*([A-Z]+)/gi,
  MFG_YEAR: /(?:MFG|MANUFACTURING)[\s]*(?:YEAR|:)?[\s]*(\d{4})/gi,

  // Power
  MAX_POWER: /(?:MAX\s*PTO|PTO|POWER|HP)[\s:]*([0-9.]+)\s*(?:HP|KW)?\b/gi,
  MAX_POWER_ALT: /([0-9.]+)\s*(?:HP|PTO)/gi,

  // Name from Aadhaar
  NAME_LINE: /^([A-Z\s]+)$/gm,
};

// Helper to clean and normalize text
export function cleanText(text: string): string {
  return text
    .replace(/[|!@#$%^&*_+=<>?\/\\,;:'"`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to extract first match group
export function extractFirst(pattern: RegExp, text: string): string {
  const match = pattern.exec(text);
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
}

// Helper to extract all matches
export function extractAll(pattern: RegExp, text: string): string[] {
  const matches: string[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    matches.push(match[1] ? match[1].trim() : match[0].trim());
  }
  return matches;
}