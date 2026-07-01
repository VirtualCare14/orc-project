import { RegistrationFormData } from '@/types';
import { REGEX_PATTERNS, extractFirst, cleanText } from './regex';

export function parseInvoice(text: string): {
  data: Partial<RegistrationFormData>;
  confidence: Record<string, number>;
} {
  const cleaned = cleanText(text);
  const upperText = cleaned.toUpperCase();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract Customer Name
  let customerName = extractFirst(REGEX_PATTERNS.CUSTOMER, upperText);
  if (!customerName) {
    const nameMatch = upperText.match(/(?:M\/S|MESSRS|BUYER|NAME)[\s:]+(.+?)(?:\n|$)/i);
    if (nameMatch) customerName = nameMatch[1].trim();
  }
  if (customerName && customerName.length > 60) {
    customerName = customerName.split(/[,\n]/)[0].trim();
  }

  // Extract Father Name
  let fatherName = extractFirst(REGEX_PATTERNS.FATHER, upperText);
  if (!fatherName) {
    const fatherMatch = upperText.match(/FATHER['']?S?\s*NAME[\s:]+(.+?)(?:\n|$)/i);
    if (fatherMatch) fatherName = fatherMatch[1].trim();
  }
  if (!fatherName && customerName) {
    const soMatch = upperText.match(/(?:S\/O|D\/O|C\/O)[\s:]+(.+?)(?:\n|$)/i);
    if (soMatch) fatherName = soMatch[1].trim();
  }

  // Extract Invoice Number
  let invoiceNumber = extractFirst(REGEX_PATTERNS.INVOICE_NO, upperText);
  if (!invoiceNumber) {
    const invMatch = upperText.match(/(?:BILL|INV)[\s:#]*([A-Z0-9\-/]+)/i);
    if (invMatch) invoiceNumber = invMatch[1].trim();
  }

  // Extract Invoice Date
  let invoiceDate = extractFirst(REGEX_PATTERNS.INVOICE_DATE, upperText);
  if (!invoiceDate) {
    invoiceDate = extractFirst(REGEX_PATTERNS.DATE_GENERAL, upperText);
  }
  if (!invoiceDate) {
    const dateMatch = upperText.match(/(?:DATE|DT)[\s:]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i);
    if (dateMatch) invoiceDate = dateMatch[1];
  }

  // Extract Model
  let model = extractFirst(REGEX_PATTERNS.MODEL, upperText);
  if (!model) {
    const modelMatch = upperText.match(/MODEL[\s:]+(.+?)(?:\n|$)/i);
    if (modelMatch) model = modelMatch[1].trim();
  }

  // Extract Colour
  let colour = extractFirst(REGEX_PATTERNS.COLOUR, upperText);
  if (!colour) {
    const colourMatch = upperText.match(/(?:COLOUR|COLOR)[\s:]+(.+?)(?:\n|$)/i);
    if (colourMatch) colour = colourMatch[1].trim();
  }

  // Extract Year
  let year = '';
  const yearMatch = upperText.match(REGEX_PATTERNS.YEAR);
  if (yearMatch) {
    const validYears = yearMatch.filter((y) => parseInt(y) >= 2020 && parseInt(y) <= 2030);
    if (validYears.length > 0) {
      year = validYears[0];
    } else if (yearMatch.length > 0) {
      year = yearMatch[0];
    }
  }

  // Extract Engine Number
  let engineNumber = extractFirst(REGEX_PATTERNS.ENGINE, upperText);
  if (!engineNumber) engineNumber = extractFirst(REGEX_PATTERNS.ENGINE_ALT, upperText);

  // Extract Chassis Number
  let chassisNumber = extractFirst(REGEX_PATTERNS.CHASSIS, upperText);
  if (!chassisNumber) chassisNumber = extractFirst(REGEX_PATTERNS.CHASSIS_ALT, upperText);
  if (!chassisNumber) chassisNumber = extractFirst(REGEX_PATTERNS.CHASSIS_ATIN, upperText);

  // Extract Amount
  let invoiceAmount = extractFirst(REGEX_PATTERNS.AMOUNT, upperText);
  if (!invoiceAmount) {
    const amountMatch = upperText.match(/(?:TOTAL|GRAND\s+TOTAL|NET|AMOUNT)[\s:]*₹?\s*([0-9,]+\.?\d*)/i);
    if (amountMatch) invoiceAmount = amountMatch[1];
  }

  // Extract Finance Bank
  let financeBank = extractFirst(REGEX_PATTERNS.FINANCE, upperText);
  if (!financeBank) {
    const bankMatch = upperText.match(/(?:BANK|FINANCED\s+BY|THROUGH)[\s:]*(.+?)(?:\n|$)/i);
    if (bankMatch) financeBank = bankMatch[1].trim();
  }

  // Extract Village, District, State
  let village = '';
  let district = '';
  let state = '';

  const addrStart = lines.findIndex(
    (l) => l.match(/ADDRESS|VILL|DIST|ADDR/i)
  );

  if (addrStart >= 0) {
    const addrText = lines.slice(addrStart, addrStart + 6).join(' ').toUpperCase();
    const villMatch = addrText.match(REGEX_PATTERNS.VILLAGE);
    if (villMatch) village = villMatch[0].replace(/VILL[AGE]*/i, '').trim();
    const distMatch = addrText.match(REGEX_PATTERNS.DISTRICT);
    if (distMatch) district = distMatch[0].replace(/DIST[RICT]*/i, '').trim();
    const stateMatch = addrText.match(REGEX_PATTERNS.STATE);
    if (stateMatch) state = stateMatch[0].replace(/STATE/i, '').trim();
  }

  if (!village || !district) {
    for (const line of lines) {
      const upper = line.toUpperCase();
      if (!village && upper.match(/VILL/)) {
        village = upper.replace(/VILL[AGE]*[\s:]*/i, '').trim();
      }
      if (!district && upper.match(/DIST/)) {
        district = upper.replace(/DIST[RICT]*[\s:]*/i, '').trim();
      }
      if (!state && upper.match(/STATE/)) {
        state = upper.replace(/STATE[\s:]*/i, '').trim();
      }
    }
  }

  const data: Partial<RegistrationFormData> = {
    ownerName: customerName,
    fatherName,
    village,
    district,
    state,
    invoiceNumber,
    invoiceDate,
    engineNumber,
    chassisNumber,
    model,
    colour,
    year,
    invoiceAmount,
    financeBank,
  };

  const confidence: Record<string, number> = {
    ownerName: customerName ? 80 : 0,
    fatherName: fatherName ? 70 : 0,
    village: village ? 65 : 0,
    district: district ? 65 : 0,
    state: state ? 70 : 0,
    invoiceNumber: invoiceNumber ? 85 : 0,
    invoiceDate: invoiceDate ? 80 : 0,
    engineNumber: engineNumber ? 75 : 0,
    chassisNumber: chassisNumber ? 80 : 0,
    model: model ? 70 : 0,
    colour: colour ? 75 : 0,
    year: year ? 85 : 0,
    invoiceAmount: invoiceAmount ? 85 : 0,
    financeBank: financeBank ? 70 : 0,
  };

  return { data, confidence };
}