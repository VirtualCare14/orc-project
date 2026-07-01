'use client';

interface OCRProgressProps {
  progress: number;
  status: string;
  visible: boolean;
}

export default function OCRProgress({ progress, status, visible }: OCRProgressProps) {
  if (!visible) return null;

  return (
    <div className="w-full bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-700">{status}</span>
        <span className="text-sm font-bold text-blue-600">{progress}%</span>
      </div>
      <div className="w-full bg-blue-50 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress < 100 && (
        <div className="mt-2 flex justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}