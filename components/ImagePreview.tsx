'use client';

interface ImagePreviewProps {
  imageUrl: string;
  label: string;
}

export default function ImagePreview({ imageUrl, label }: ImagePreviewProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-700">{label}</h4>
      </div>
      <div className="p-2 flex items-center justify-center bg-gray-50/50">
        <img
          src={imageUrl}
          alt={label}
          className="max-w-full max-h-48 object-contain rounded-lg"
        />
      </div>
    </div>
  );
}