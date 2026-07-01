'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (blob: Blob, dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string>('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setError(message);
      setLoading(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(dataUrl);

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  }, []);

  const retake = useCallback(() => {
    setCaptured(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(async () => {
    if (!captured) return;
    const response = await fetch(captured);
    const blob = await response.blob();
    onCapture(blob, captured);
  }, [captured, onCapture]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg">
          <X size={24} />
        </button>
        <h3 className="font-semibold">Capture Document</h3>
        <button onClick={switchCamera} className="p-2 hover:bg-white/10 rounded-lg">
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Camera viewfinder */}
      <div className="flex-1 relative flex items-center justify-center">
        {loading && (
          <div className="text-white text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Starting camera...</p>
          </div>
        )}

        {error && (
          <div className="text-red-400 text-center p-4">
            <p className="text-lg font-semibold mb-2">Camera Error</p>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-gray-400">
              Please ensure camera permissions are granted.
            </p>
          </div>
        )}

        {!captured && !error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="max-w-full max-h-full object-contain"
          />
        )}

        {captured && (
          <img src={captured} alt="Captured" className="max-w-full max-h-full object-contain" />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom controls */}
      <div className="p-6 flex items-center justify-center gap-8">
        {captured ? (
          <>
            <button
              onClick={retake}
              className="px-6 py-3 rounded-full bg-gray-600 text-white font-medium hover:bg-gray-500 transition-colors"
            >
              Retake
            </button>
            <button
              onClick={confirmCapture}
              className="px-8 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
            >
              Use Photo
            </button>
          </>
        ) : (
          !error && (
            <button
              onClick={capture}
              className="w-16 h-16 rounded-full bg-white border-4 border-blue-500 flex items-center justify-center hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-300" />
            </button>
          )
        )}
      </div>
    </div>
  );
}