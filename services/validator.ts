import { z } from 'zod';

export const registrationFormSchema = z.object({
  ownerName: z.string().min(2, 'Name must be at least 2 characters'),
  fatherName: z.string().default(''),
  dob: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'DOB must be in DD/MM/YYYY format'),
  gender: z.string().min(1, 'Gender is required'),
  aadhaarNumber: z
    .string()
    .regex(/^\d{4}\s?\d{4}\s?\d{4}$/, 'Aadhaar must be 12 digits')
    .transform((val) => val.replace(/\s/g, '')),
  address: z.string().min(5, 'Address is required'),
  village: z.string().default(''),
  district: z.string().default(''),
  state: z.string().default(''),
  pin: z.string().regex(/^\d{6}$/, 'PIN must be 6 digits'),
  engineNumber: z.string().min(3, 'Engine number is required'),
  chassisNumber: z.string().min(5, 'Chassis number is required'),
  model: z.string().min(1, 'Model is required'),
  colour: z.string().default(''),
  year: z.string().default(''),
  invoiceNumber: z.string().min(2, 'Invoice number is required'),
  invoiceDate: z.string().default(''),
  invoiceAmount: z.string().default(''),
  financeBank: z.string().default(''),
  mobileNumber: z.string().default(''),
  price: z.string().default(''),
  dealership: z.string().default(''),
  rtoOffice: z.string().default(''),
});

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export function validateField(field: string, value: string): string | null {
  switch (field) {
    case 'ownerName':
      return value.length < 2 ? 'Name must be at least 2 characters' : null;
    case 'dob':
      return /^\d{2}\/\d{2}\/\d{4}$/.test(value) ? null : 'DOB must be in DD/MM/YYYY format';
    case 'gender':
      return value ? null : 'Gender is required';
    case 'aadhaarNumber': {
      const cleaned = value.replace(/\s/g, '');
      return /^\d{12}$/.test(cleaned) ? null : 'Aadhaar must be 12 digits';
    }
    case 'pin':
      return /^\d{6}$/.test(value) ? null : 'PIN must be 6 digits';
    case 'engineNumber':
      return value.length < 3 ? 'Engine number is required' : null;
    case 'chassisNumber':
      return value.length < 5 ? 'Chassis number is required' : null;
    case 'invoiceNumber':
      return value.length < 2 ? 'Invoice number is required' : null;
    default:
      return null;
  }
}

export function validateAadhaarNumber(aadhaar: string): boolean {
  const cleaned = aadhaar.replace(/\s/g, '');
  return /^\d{12}$/.test(cleaned);
}

export function validatePIN(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function validateDate(date: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(date);
}