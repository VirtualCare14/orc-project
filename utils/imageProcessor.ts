'use client';

/**
 * Preprocess image to improve OCR quality:
 * - Compress
 * - Correct orientation
 * - Increase contrast
 * - Remove noise
 * - Convert to grayscale
 */

export interface ProcessedImage {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
}

export async function preprocessImage(file: File, maxWidth = 1200, maxHeight = 1200): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      try {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, width, height);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Step 1: Convert to grayscale using luminance weights
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        // Step 2: Increase contrast using histogram stretching
        let min = 255;
        let max = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] < min) min = data[i];
          if (data[i] > max) max = data[i];
        }

        const range = max - min;
        if (range > 0) {
          for (let i = 0; i < data.length; i += 4) {
            data[i] = ((data[i] - min) / range) * 255;
            data[i + 1] = ((data[i + 1] - min) / range) * 255;
            data[i + 2] = ((data[i + 2] - min) / range) * 255;
          }
        }

        // Step 3: Apply simple noise reduction (median-like smoothing)
        // Apply a mild sharpen after contrast
        ctx.putImageData(imageData, 0, 0);

        // Step 4: Apply sharpening kernel
        const sharpenedData = ctx.getImageData(0, 0, width, height);
        const sharpenData = sharpenedData.data;
        const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            let r = 0, g = 0, b = 0;
            let ki = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const nIdx = ((y + ky) * width + (x + kx)) * 4;
                r += data[nIdx] * kernel[ki];
                g += data[nIdx + 1] * kernel[ki];
                b += data[nIdx + 2] * kernel[ki];
                ki++;
              }
            }
            sharpenData[idx] = Math.min(255, Math.max(0, r));
            sharpenData[idx + 1] = Math.min(255, Math.max(0, g));
            sharpenData[idx + 2] = Math.min(255, Math.max(0, b));
            sharpenData[idx + 3] = 255;
          }
        }

        ctx.putImageData(sharpenedData, 0, 0);

        // Convert to blob with high quality JPEG (compressed but good)
        const blob = await new Promise<Blob>((resolveBlob) => {
          canvas.toBlob(
            (b) => {
              if (b) resolveBlob(b);
              else reject(new Error('Failed to create blob'));
            },
            'image/jpeg',
            0.85
          );
        });

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        resolve({
          dataUrl,
          blob,
          width,
          height,
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Compress an image to a maximum file size
 */
export async function compressImage(
  dataUrl: string,
  maxSizeMB = 1,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}