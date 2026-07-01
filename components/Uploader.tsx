'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Camera, Image as ImageIcon } from 'lucide-react';
import CameraCapture from './CameraCapture';

interface UploaderProps {
  label: string;
  description: string;
  accept?: string;
  onFileSelected: (file: File) => void;
  imagePreview?: string | null;
  disabled?: boolean;
}

export default function Uploader({
  label,
  description,
  accept = 'image/*',
  onFileSelected,
  imagePreview,
  disabled = false,
}: UploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelected(file);
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelected(files[0]);
    }
  };

  const handleCameraCapture = async (blob: Blob, dataUrl: string) => {
    const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onFileSelected(file);
    setShowCamera(false);
  };

  const handleClick = () => {
    if (!disabled && !imagePreview) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          relative border-2 border-dashed rounded-xl p-6 cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02]'
            : imagePreview
              ? 'border-green-300 bg-green-50/30'
              : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt={label}
              className="w-full h-40 object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
              <span className="text-white bg-black/50 px-3 py-1 rounded-full text-sm opacity-0 hover:opacity-100 transition-opacity">
                Click to change
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
              <Upload size={24} className="text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700">{label}</p>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full flex items-center gap-1">
                <ImageIcon size={12} />
                Gallery
              </span>
              <span
                className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full flex items-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCamera(true);
                }}
              >
                <Camera size={12} />
                Camera
              </span>
            </div>
          </div>
        )}
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  );
}