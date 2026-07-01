'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  FileJson,
  FileText,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Scan,
  Loader2,
  Tractor,
  Eye,
  EyeOff,
} from 'lucide-react';
import Uploader from '@/components/Uploader';
import OCRProgress from '@/components/OCRProgress';
import ImagePreview from '@/components/ImagePreview';
import EditableForm from '@/components/EditableForm';
import VerificationBadge from '@/components/VerificationBadge';
import InvoicePreview from '@/components/InvoicePreview';
import { extractFromDocument, ExtractionResult, buildRegistrationFormData } from '@/services/extractor';
import { DocumentType, AadhaarFrontData, AadhaarBackData, ChassisData } from '@/types';
import { RegistrationFormValues } from '@/services/validator';

export default function Home() {
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [chassisFile, setChassisFile] = useState<File | null>(null);

  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);
  const [chassisPreview, setChassisPreview] = useState<string | null>(null);

  const [aadhaarFrontResult, setAadhaarFrontResult] = useState<ExtractionResult | null>(null);
  const [aadhaarBackResult, setAadhaarBackResult] = useState<ExtractionResult | null>(null);
  const [chassisResult, setChassisResult] = useState<ExtractionResult | null>(null);

  const [ocrProgress, setOcrProgress] = useState<{ progress: number; status: string; visible: boolean }>({
    progress: 0,
    status: '',
    visible: false,
  });
  const [activeDocType, setActiveDocType] = useState<DocumentType | null>(null);
  const [formValues, setFormValues] = useState<RegistrationFormValues | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Track which documents have been processed
  const documentsProcessed = useMemo(() => ({
    front: aadhaarFrontResult !== null,
    back: aadhaarBackResult !== null,
    chassis: chassisResult !== null,
  }), [aadhaarFrontResult, aadhaarBackResult, chassisResult]);

  const allCompleted = documentsProcessed.front && documentsProcessed.back && documentsProcessed.chassis;
  const anyCompleted = documentsProcessed.front || documentsProcessed.back || documentsProcessed.chassis;

  // Track OCR result versions to reset form only when new OCR data arrives
  const ocrVersion = useMemo(
    () => (aadhaarFrontResult?.text || '') + (aadhaarBackResult?.text || '') + (chassisResult?.text || ''),
    [aadhaarFrontResult, aadhaarBackResult, chassisResult]
  );

  // Increment reset key when OCR results change (not on user edits)
  useEffect(() => {
    if (ocrVersion) {
      setFormResetKey((k) => k + 1);
    }
  }, [ocrVersion]);

  // Auto-build form data whenever any OCR result changes
  const currentFormDefaults = useMemo(
    () => buildRegistrationFormData(aadhaarFrontResult, aadhaarBackResult, chassisResult),
    [aadhaarFrontResult, aadhaarBackResult, chassisResult]
  );

  // Auto-show form when any document is processed
  useEffect(() => {
    if (anyCompleted && !showForm) {
      setShowForm(true);
    }
  }, [anyCompleted, showForm]);

  // Scroll to form when new data comes in
  useEffect(() => {
    if (formValues && showForm && formRef.current) {
      // Only scroll if not already visible
      const rect = formRef.current.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [formValues, showForm]);

  const handleFileSelected = useCallback(
    async (file: File, type: DocumentType) => {
      const previewUrl = URL.createObjectURL(file);

      switch (type) {
        case 'aadhaarFront':
          setAadhaarFrontFile(file);
          setAadhaarFrontPreview(previewUrl);
          break;
        case 'aadhaarBack':
          setAadhaarBackFile(file);
          setAadhaarBackPreview(previewUrl);
          break;
        case 'chassisPlate':
          setChassisFile(file);
          setChassisPreview(previewUrl);
          break;
      }

      setActiveDocType(type);
      setOcrProgress({ progress: 0, status: 'Starting...', visible: true });

      try {
        const result = await extractFromDocument(file, type, (progress, status) => {
          setOcrProgress({ progress, status, visible: true });
        });

        switch (type) {
          case 'aadhaarFront':
            setAadhaarFrontResult(result);
            break;
          case 'aadhaarBack':
            setAadhaarBackResult(result);
            break;
          case 'chassisPlate':
            setChassisResult(result);
            break;
        }

        setOcrProgress({ progress: 100, status: 'Complete!', visible: true });
        setTimeout(() => {
          setOcrProgress((prev) => ({ ...prev, visible: false }));
        }, 2000);
      } catch (err) {
        setOcrProgress({
          progress: 0,
          status: 'Error: ' + (err instanceof Error ? err.message : 'OCR failed'),
          visible: true,
        });
      } finally {
        setActiveDocType(null);
      }
    },
    []
  );

  const getAllFieldConfidence = useCallback((): Record<string, number> => {
    return {
      ...(aadhaarFrontResult?.fieldConfidence || {}),
      ...(aadhaarBackResult?.fieldConfidence || {}),
      ...(chassisResult?.fieldConfidence || {}),
    };
  }, [aadhaarFrontResult, aadhaarBackResult, chassisResult]);

  const getExtractedFieldsCount = useCallback((): number => {
    let count = 0;
    const vals = formValues;
    if (!vals) return 0;
    if (vals.ownerName) count++;
    if (vals.dob) count++;
    if (vals.gender) count++;
    if (vals.aadhaarNumber) count++;
    if (vals.address) count++;
    if (vals.village) count++;
    if (vals.district) count++;
    if (vals.state) count++;
    if (vals.pin) count++;
    if (vals.engineNumber) count++;
    if (vals.chassisNumber) count++;
    if (vals.model) count++;
    return count;
  }, [formValues]);

  const renderOcrResult = (result: ExtractionResult | null, label: string) => {
    if (!result) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = result.data as any;

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-800">{label}</h4>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
            OCR: {Math.round(result.confidence)}%
          </span>
        </div>
        <div className="space-y-1">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'photoBase64') return null;
            const conf = result.fieldConfidence[key];
            const confColor = conf !== undefined ? (conf < 60 ? 'text-red-500' : conf < 80 ? 'text-amber-500' : 'text-green-500') : '';
            return (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="text-gray-500 min-w-[120px] font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-gray-800 flex-1">{(value as string) || '-'}</span>
                {conf !== undefined && (
                  <span className={'text-xs font-medium ' + confColor + ' min-w-[36px] text-right'}>
                    {conf}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleExportJSON = () => {
    if (!formValues) return;
    const json = JSON.stringify(formValues, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tractor-registration-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-blue-100 shadow-sm sticky top-0 z-40 no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Tractor size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">Tractor Registration OCR</h1>
              <p className="text-xs text-gray-500">Aadhaar + Chassis Plate</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {allCompleted && (
              <span className="text-xs font-medium text-green-600 hidden sm:flex items-center gap-1">
                <CheckCircle size={14} />
                All Documents
              </span>
            )}
            {anyCompleted && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                {getExtractedFieldsCount()} fields extracted
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* OCR Progress */}
        <OCRProgress
          progress={ocrProgress.progress}
          status={ocrProgress.status}
          visible={ocrProgress.visible}
        />

        {/* Upload Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={'w-2 h-2 rounded-full ' + (documentsProcessed.front ? 'bg-green-500' : 'bg-blue-500')} />
              <h3 className="font-semibold text-gray-700 text-sm">Aadhaar Card (Front)</h3>
              {documentsProcessed.front && <CheckCircle size={14} className="text-green-500" />}
            </div>
            <Uploader
              label="Upload Aadhaar Front"
              description="Drag & drop or click to upload Aadhaar front side"
              onFileSelected={(file) => handleFileSelected(file, 'aadhaarFront')}
              imagePreview={aadhaarFrontPreview}
              disabled={activeDocType === 'aadhaarFront'}
            />
            {activeDocType === 'aadhaarFront' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </div>
            )}
            {documentsProcessed.front && (
              <p className="text-xs text-green-600 font-medium">&#10003; Extracted {(() => {
                const d = aadhaarFrontResult?.data as AadhaarFrontData | undefined;
                return [d?.name && 'Name', d?.dob && 'DOB', d?.gender && 'Gender', d?.aadhaarNumber && 'Aadhaar'].filter(Boolean).join(', ');
              })()}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={'w-2 h-2 rounded-full ' + (documentsProcessed.back ? 'bg-green-500' : 'bg-green-500')} />
              <h3 className="font-semibold text-gray-700 text-sm">Aadhaar Card (Back)</h3>
              {documentsProcessed.back && <CheckCircle size={14} className="text-green-500" />}
            </div>
            <Uploader
              label="Upload Aadhaar Back"
              description="Drag & drop or click to upload Aadhaar back side"
              onFileSelected={(file) => handleFileSelected(file, 'aadhaarBack')}
              imagePreview={aadhaarBackPreview}
              disabled={activeDocType === 'aadhaarBack'}
            />
            {activeDocType === 'aadhaarBack' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </div>
            )}
            {documentsProcessed.back && (
              <p className="text-xs text-green-600 font-medium">&#10003; Address extracted</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={'w-2 h-2 rounded-full ' + (documentsProcessed.chassis ? 'bg-green-500' : 'bg-amber-500')} />
              <h3 className="font-semibold text-gray-700 text-sm">Tractor Chassis Plate</h3>
              {documentsProcessed.chassis && <CheckCircle size={14} className="text-green-500" />}
            </div>
            <Uploader
              label="Upload Chassis Plate"
              description="Drag & drop or click to upload embossed chassis plate image"
              onFileSelected={(file) => handleFileSelected(file, 'chassisPlate')}
              imagePreview={chassisPreview}
              disabled={activeDocType === 'chassisPlate'}
            />
            {activeDocType === 'chassisPlate' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </div>
            )}
            {documentsProcessed.chassis && (
              <p className="text-xs text-green-600 font-medium">&#10003; Chassis details extracted</p>
            )}
          </div>
        </div>

        {/* Status bar - shows what's been extracted so far */}
        {anyCompleted && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-800 flex items-center justify-between">
            <span>
              <strong>{getExtractedFieldsCount()}</strong> fields extracted from{' '}
              {[documentsProcessed.front && 'Aadhaar Front', documentsProcessed.back && 'Aadhaar Back', documentsProcessed.chassis && 'Chassis Plate']
                .filter(Boolean)
                .join(', ')}
              . Edit any field manually below.
            </span>
            {formValues && (
              <button
                onClick={() => setShowInvoice(!showInvoice)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors ml-3 shrink-0"
              >
                {showInvoice ? <EyeOff size={14} /> : <Eye size={14} />}
                {showInvoice ? 'Hide Invoice' : 'View Invoice'}
              </button>
            )}
          </div>
        )}

        {/* View Invoice Button (when form has data but invoice not visible) */}
        {formValues && !showInvoice && !anyCompleted && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowInvoice(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Eye size={18} />
              View Invoice
            </button>
          </div>
        )}

        {/* OCR Results (collapsible) */}
        {(aadhaarFrontResult || aadhaarBackResult || chassisResult) && (
          <div>
            <button
              onClick={() => setPreviewExpanded(!previewExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 hover:text-blue-600 transition-colors"
            >
              <Scan size={16} />
              OCR Extraction Details
              {previewExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {previewExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderOcrResult(aadhaarFrontResult, 'Aadhaar Front')}
                {renderOcrResult(aadhaarBackResult, 'Aadhaar Back')}
                {renderOcrResult(chassisResult, 'Chassis Plate')}
              </div>
            )}
          </div>
        )}

        {/* Verification Section */}
        {chassisResult && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              Chassis Data Extracted
            </h3>
            <div className="space-y-1">
              <VerificationBadge
                fieldName="Chassis Number"
                chassisValue={(chassisResult.data as ChassisData).chassisNumber}
                invoiceValue={(chassisResult.data as ChassisData).chassisNumber}
              />
              <VerificationBadge
                fieldName="Engine Number"
                chassisValue={(chassisResult.data as ChassisData).engineNumber}
                invoiceValue={(chassisResult.data as ChassisData).engineNumber}
              />
            </div>
          </div>
        )}

        {/* Editable Form - auto-shows after any document processed */}
        {showForm && (
          <div ref={formRef} className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Registration Form</h2>
              <div className="flex gap-2 no-print">
                <button
                  onClick={handleExportJSON}
                  className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 transition-colors"
                  title="Download JSON"
                >
                  <FileJson size={14} />
                  JSON
                </button>
              </div>
            </div>
            <EditableForm
              key={formResetKey}
              defaultValues={currentFormDefaults}
              fieldConfidence={getAllFieldConfidence()}
              onValuesChange={(values) => setFormValues(values)}
            />
          </div>
        )}

        {/* Invoice Preview - live, always up-to-date */}
        {showInvoice && formValues && (
          <div ref={invoiceRef} className="pt-2">
            <InvoicePreview data={formValues} />
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-100 no-print">
          Tractor Registration OCR System &middot; Powered by Tesseract.js &middot; All processing is client-side
        </footer>
      </main>

      {/* Image Previews */}
      {(aadhaarFrontPreview || aadhaarBackPreview || chassisPreview) && previewExpanded && (
        <div className="max-w-6xl mx-auto px-4 pb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Image Previews</h3>
          <div className="grid grid-cols-3 gap-3">
            {aadhaarFrontPreview && <ImagePreview imageUrl={aadhaarFrontPreview} label="Aadhaar Front" />}
            {aadhaarBackPreview && <ImagePreview imageUrl={aadhaarBackPreview} label="Aadhaar Back" />}
            {chassisPreview && <ImagePreview imageUrl={chassisPreview} label="Chassis Plate" />}
          </div>
        </div>
      )}
    </div>
  );
}