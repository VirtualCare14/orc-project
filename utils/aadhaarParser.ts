import { AadhaarFrontData, AadhaarBackData } from '@/types';
import { REGEX_PATTERNS, cleanText } from './regex';

export function parseAadhaarFront(text: string): {
  data: AadhaarFrontData;
  confidence: Record<string, number>;
} {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const cleaned = cleanText(text);

  // Find Aadhaar Number
  const aadhaarMatch = cleaned.match(REGEX_PATTERNS.AADHAAR);
  let aadhaarNumber = '';
  if (aadhaarMatch && aadhaarMatch.length > 0) {
    aadhaarNumber = aadhaarMatch[0].replace(/\s/g, '');
    if (aadhaarNumber.length === 12) {
      aadhaarNumber = aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
    }
  }

  // Find DOB
  const dobMatch = cleaned.match(REGEX_PATTERNS.DOB);
  const dob = dobMatch ? dobMatch[0] : '';

  // Find Gender
  const genderMatch = cleaned.match(REGEX_PATTERNS.GENDER);
  let gender = genderMatch
    ? genderMatch[0].charAt(0).toUpperCase() + genderMatch[0].slice(1).toLowerCase()
    : '';

  // Find Name - usually lines without numbers before DOB line
  let name = '';
  const dobLineIndex = lines.findIndex(
    (l) => l.match(/\d{2}[/\-]\d{2}[/\-]\d{4}/)
  );
  if (dobLineIndex > 0) {
    // Check lines above DOB for name (skip "GOVERNMENT" or similar header lines)
    for (let i = dobLineIndex - 1; i >= 0; i--) {
      const candidate = lines[i].replace(/['']/g, '').trim();
      if (
        candidate.length > 3 &&
        !candidate.match(/\d/) &&
        !candidate.match(/GOVERNMENT|INDIA|AADHAAR|जन्म|लिंग|पुरुष|महिला|GOVIDATE|DOB|MALE|FEMALE/i) &&
        candidate.length < 40
      ) {
        name = candidate.toUpperCase();
        break;
      }
    }
  }

  // Fallback: try to find all-caps name line
  if (!name) {
    const nameLines = cleaned.match(REGEX_PATTERNS.NAME_LINE);
    if (nameLines) {
      // Filter out common non-name lines
      const filtered = nameLines.filter(
        (l) =>
          l.length > 2 &&
          l.length < 40 &&
          !l.match(/\d/) &&
          !l.match(/GOVERNMENT|INDIA|AADHAAR|OF|VID|UIDAI/i)
      );
      if (filtered.length > 0) {
        // Usually the shortest meaningful capitalized line is the name
        name = filtered.reduce((a, b) => (a.length <= b.length ? a : b)).trim();
      }
    }
  }

  const data: AadhaarFrontData = {
    name,
    dob,
    gender,
    aadhaarNumber,
  };

  // Calculate confidence
  const confidence: Record<string, number> = {
    name: name ? Math.min(85, 100 - name.length * 2) : 0,
    dob: dob ? 90 : 0,
    gender: gender ? 95 : 0,
    aadhaarNumber: aadhaarNumber.length === 14 ? 98 : aadhaarNumber.length > 0 ? 70 : 0,
  };

  return { data, confidence };
}

export function parseAadhaarBack(text: string): {
  data: AadhaarBackData;
  confidence: Record<string, number>;
} {
  const cleaned = cleanText(text);
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  // Extract address - usually the bulk of text after headers
  const addressStart = lines.findIndex(
    (l) => l.match(/ADDRESS|पता|ADDR/i) && !l.match(/PERMANENT|CURRENT/i)
  );

  let address = '';
  let houseNumber = '';
  let village = '';
  let postOffice = '';
  let district = '';
  let state = '';
  let pinCode = '';

  if (addressStart >= 0) {
    // Collect address lines (skip header)
    const addressLines: string[] = [];
    for (let i = addressStart + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (
        line.length > 1 &&
        !line.match(/^\d{6}$/) &&
        !line.match(/MALE|FEMALE|पुरुष|महिला|AADHAAR|UIDAI|VID/i)
      ) {
        addressLines.push(line);
      }
    }
    address = addressLines.join(', ').trim();
  } else {
    // Try to find address as multiline after name/header
    const addrLines: string[] = [];
    for (const line of lines) {
      if (
        line.length > 5 &&
        !line.match(/AADHAAR|UIDAI|GOVERNMENT|INDIA|VID|MALE|FEMALE|\d{6}/i) &&
        !line.match(/^[A-Z\s]{2,30}$/) // Skip single-word headers
      ) {
        addrLines.push(line);
      }
    }
    address = addrLines.join(', ').trim();
  }

  if (address) {
    // Extract PIN from address
    const pinMatch = address.match(/\b(\d{6})\b/);
    if (pinMatch) {
      pinCode = pinMatch[1];
    }

    // Extract components from address
    const upperAddr = address.toUpperCase();

    // Try to find state (usually last 2-3 words before PIN)
    const stateMatch = upperAddr.match(REGEX_PATTERNS.STATE);
    if (stateMatch) state = stateMatch[0].replace(/STATE/i, '').trim();

    // District
    const distMatch = upperAddr.match(REGEX_PATTERNS.DISTRICT);
    if (distMatch) district = distMatch[0].replace(/DIST/i, '').trim();

    // Village
    const villMatch = upperAddr.match(REGEX_PATTERNS.VILLAGE);
    if (villMatch) village = villMatch[0].replace(/VILL/i, '').trim();

    // Post Office
    const poMatch = upperAddr.match(REGEX_PATTERNS.POST_OFFICE);
    if (poMatch) postOffice = poMatch[0].replace(/POST\s*OFFICE?/i, '').trim();

    // House Number
    const houseMatch = upperAddr.match(REGEX_PATTERNS.HOUSE);
    if (houseMatch) houseNumber = houseMatch[0].replace(/HOUSE\s*(NO|NUMBER|#)?/i, '').trim();

    // Fallback state detection - last meaningful word before PIN
    if (!state && pinCode) {
      const parts = address.replace(pinCode, '').split(',').map((p) => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        const lastPart = parts[parts.length - 1].trim();
        const knownStates = [
          'ANDHRA PRADESH', 'ARUNACHAL PRADESH', 'ASSAM', 'BIHAR', 'CHHATTISGARH',
          'GOA', 'GUJARAT', 'HARYANA', 'HIMACHAL PRADESH', 'JHARKHAND',
          'KARNATAKA', 'KERALA', 'MADHYA PRADESH', 'MAHARASHTRA', 'MANIPUR',
          'MEGHALAYA', 'MIZORAM', 'NAGALAND', 'ODISHA', 'PUNJAB',
          'RAJASTHAN', 'SIKKIM', 'TAMIL NADU', 'TELANGANA', 'TRIPURA',
          'UTTAR PRADESH', 'UTTARAKHAND', 'WEST BENGAL',
        ];
        for (const s of knownStates) {
          if (lastPart.toUpperCase().includes(s)) {
            state = s;
            break;
          }
        }
      }
    }
  }

  const data: AadhaarBackData = {
    address,
    houseNumber,
    village,
    postOffice,
    district,
    state,
    pinCode,
  };

  const confidence: Record<string, number> = {
    address: address ? 80 : 0,
    houseNumber: houseNumber ? 70 : 0,
    village: village ? 65 : 0,
    postOffice: postOffice ? 65 : 0,
    district: district ? 70 : 0,
    state: state ? 75 : 0,
    pinCode: pinCode ? 95 : 0,
  };

  return { data, confidence };
}