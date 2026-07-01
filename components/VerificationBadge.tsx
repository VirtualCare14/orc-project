'use client';

import { CheckCircle, AlertTriangle } from 'lucide-react';

interface VerificationBadgeProps {
  fieldName: string;
  chassisValue: string;
  invoiceValue: string;
}

export default function VerificationBadge({
  fieldName,
  chassisValue,
  invoiceValue,
}: VerificationBadgeProps) {
  const isMatch =
    chassisValue?.trim().toUpperCase() === invoiceValue?.trim().toUpperCase();
  const hasValues = chassisValue && invoiceValue;

  if (!hasValues) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
        <span>{fieldName}: Awaiting data</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm font-medium ${
        isMatch ? 'text-green-600' : 'text-amber-600'
      }`}
    >
      {isMatch ? (
        <CheckCircle size={18} className="text-green-500" />
      ) : (
        <AlertTriangle size={18} className="text-amber-500" />
      )}
      <span>
        {fieldName}:{' '}
        <span className={isMatch ? 'text-green-700' : 'text-amber-700'}>
          {isMatch ? 'Verified' : 'Mismatch'}
        </span>
        <span className="text-gray-500 ml-1">
          (Chassis: {chassisValue} | Invoice: {invoiceValue})
        </span>
      </span>
    </div>
  );
}