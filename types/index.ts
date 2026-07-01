export type DocumentType = 'aadhaarFront' | 'aadhaarBack' | 'chassisPlate';

export interface UploadedDocument {
  id: string;
  type: DocumentType;
  file: File;
  imageUrl: string;
  processedImageUrl?: string;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: AadhaarFrontData | AadhaarBackData | ChassisData;
  error?: string;
  confidence?: Record<string, number>;
}

export interface AadhaarFrontData {
  name: string;
  dob: string;
  gender: string;
  aadhaarNumber: string;
  photoBase64?: string;
}

export interface AadhaarBackData {
  address: string;
  houseNumber: string;
  village: string;
  postOffice: string;
  district: string;
  state: string;
  pinCode: string;
}

export interface ChassisData {
  model: string;
  engineNumber: string;
  chassisNumber: string;
  manufacturingDate: string;
  maxPower: string;
}

export interface RegistrationFormData {
  // Personal Info (from Aadhaar Front)
  ownerName: string;
  fatherName: string;
  dob: string;
  gender: string;
  aadhaarNumber: string;

  // Address (from Aadhaar Back)
  address: string;
  village: string;
  district: string;
  state: string;
  pin: string;

  // Tractor Info (from Chassis Plate)
  engineNumber: string;
  chassisNumber: string;
  model: string;
  colour: string;
  year: string;

  // Invoice fields (user editable, for the generated invoice)
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: string;
  financeBank: string;
  mobileNumber: string;
  price: string;
  dealership: string;
  rtoOffice: string;
}

export type OCRFieldConfidence = Record<string, number>;