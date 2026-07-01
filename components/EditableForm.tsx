'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registrationFormSchema, RegistrationFormValues } from '@/services/validator';
import { useEffect } from 'react';

interface EditableFormProps {
  defaultValues: Partial<RegistrationFormValues>;
  fieldConfidence?: Record<string, number>;
  onValuesChange?: (values: RegistrationFormValues) => void;
  readOnly?: boolean;
}

export default function EditableForm({
  defaultValues,
  fieldConfidence = {},
  onValuesChange,
  readOnly = false,
}: EditableFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registrationFormSchema) as any,
    defaultValues: {
      ownerName: '',
      fatherName: '',
      dob: '',
      gender: '',
      aadhaarNumber: '',
      address: '',
      village: '',
      district: '',
      state: '',
      pin: '',
      engineNumber: '',
      chassisNumber: '',
      model: '',
      colour: '',
      year: '',
      invoiceNumber: '',
      invoiceDate: '',
      invoiceAmount: '',
      financeBank: '',
      ...defaultValues,
    },
  });

  const watchedValues = watch();

  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(watchedValues as RegistrationFormValues);
    }
  }, [watchedValues, onValuesChange]);

  const getConfidenceColor = (field: string): string => {
    const conf = fieldConfidence[field];
    if (conf === undefined) return '';
    if (conf < 60) return 'bg-yellow-50 border-yellow-300';
    if (conf < 80) return 'bg-yellow-50/50 border-yellow-200';
    return '';
  };

  const getConfidenceBadge = (field: string) => {
    const conf = fieldConfidence[field];
    if (conf === undefined) return null;
    const color = conf < 60 ? 'text-red-600 bg-red-50' : conf < 80 ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50';
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
        {conf}%
      </span>
    );
  };

  const renderField = (
    label: string,
    field: keyof RegistrationFormValues,
    options?: { type?: string; placeholder?: string; className?: string; rows?: number }
  ) => {
    const error = errors[field];
    const confidenceClass = getConfidenceColor(field);

    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {getConfidenceBadge(field)}
        </div>
        {options?.rows ? (
          <textarea
            {...register(field)}
            rows={options.rows}
            placeholder={options.placeholder}
            readOnly={readOnly}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
              error ? 'border-red-400 bg-red-50' : confidenceClass || 'border-gray-300'
            } ${readOnly ? 'bg-gray-50 cursor-default' : 'bg-white'}`}
          />
        ) : (
          <input
            {...register(field)}
            type={options?.type || 'text'}
            placeholder={options?.placeholder}
            readOnly={readOnly}
            className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
              error ? 'border-red-400 bg-red-50' : confidenceClass || 'border-gray-300'
            } ${readOnly ? 'bg-gray-50 cursor-default' : 'bg-white'}`}
          />
        )}
        {error && (
          <p className="text-xs text-red-500 mt-1">{error.message}</p>
        )}
      </div>
    );
  };

  return (
    <form className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Owner Name', 'ownerName', { placeholder: 'Full name as per Aadhaar' })}
          {renderField("Father's Name", 'fatherName', { placeholder: "Father's name" })}
          {renderField('Date of Birth', 'dob', { type: 'text', placeholder: 'DD/MM/YYYY' })}
          {renderField('Gender', 'gender', { placeholder: 'Male / Female' })}
          {renderField('Aadhaar Number', 'aadhaarNumber', { placeholder: 'XXXX XXXX XXXX' })}
          {renderField('Mobile Number', 'mobileNumber', { type: 'tel', placeholder: '10-digit mobile' })}
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-green-500 rounded-full" />
          Address Information
        </h3>
        <div className="space-y-4">
          {renderField('Address', 'address', { rows: 3, placeholder: 'Full address' })}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderField('Village', 'village')}
            {renderField('District', 'district')}
            {renderField('State', 'state')}
          </div>
          {renderField('PIN Code', 'pin', { placeholder: '6-digit PIN' })}
        </div>
      </div>

      {/* Tractor Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
          Tractor Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Engine Number', 'engineNumber', { placeholder: 'Engine number' })}
          {renderField('Chassis Number', 'chassisNumber', { placeholder: 'Chassis number' })}
          {renderField('Model', 'model', { placeholder: 'Tractor model' })}
          {renderField('Colour', 'colour', { placeholder: 'Colour' })}
          {renderField('Year', 'year', { placeholder: 'Manufacturing year' })}
        </div>
      </div>

      {/* Invoice Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
          Invoice Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Invoice Number', 'invoiceNumber', { placeholder: 'Invoice number' })}
          {renderField('Invoice Date', 'invoiceDate', { placeholder: 'DD/MM/YYYY' })}
          {renderField('Invoice Amount', 'invoiceAmount', { placeholder: 'Amount' })}
          {renderField('Finance Bank', 'financeBank', { placeholder: 'Bank name' })}
          {renderField('Price (Ex-showroom)', 'price', { placeholder: 'Ex-showroom price' })}
          {renderField('Dealership', 'dealership', { placeholder: 'Dealer name' })}
          {renderField('RTO Office', 'rtoOffice', { placeholder: 'RTO office name' })}
        </div>
      </div>
    </form>
  );
}