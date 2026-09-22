/**
 * High-compatibility Image Processor for Standby Desk Wallpapers
 * Supports all standard and modern image formats:
 * JPG, JPEG, PNG, WEBP, AVIF, GIF, BMP, SVG, JFIF, HEIC/HEIF
 */

export interface ProcessedImageResult {
  dataUrl: string;
  blob: Blob;
  name: string;
  format: string;
  width: number;
  height: number;
  sizeBytes: number;
}

const SUPPORTED_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'webp',
  'avif',
  'gif',
  'bmp',
  'svg',
  'jfif',
  'pjpeg',
  'heic',
  'heif',
];

/**
 * Infer correct MIME type from file extension or file.type
 */
export function getNormalizedMimeType(file: File): string {
  if (file.type && file.type.startsWith('image/')) {
    if (file.type === 'image/pjpeg') return 'image/jpeg';
    return file.type;
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'jfif':
    case 'pjpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'gif':
      return 'image/gif';
    case 'bmp':
      return 'image/bmp';
    case 'svg':
      return 'image/svg+xml';
    case 'heic':
    case 'heif':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

/**
 * Validate if file is an acceptable image
 */
export function isSupportedImageFile(file: File): boolean {
  if (file.type && file.type.startsWith('image/')) return true;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * Process and optimize an uploaded image file for wallpaper usage.
 * Automatically downsamples huge images (e.g. 20MB 6000x4000 camera photos)
 * to crisp 2560px max dimension to guarantee high performance and avoid storage crashes,
 * while keeping 100% visual fidelity on Retina and 4K desktop screens.
 */
export async function processImageFile(file: File): Promise<ProcessedImageResult> {
  const mimeType = getNormalizedMimeType(file);
  const isSvg = mimeType === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
  const isGif = mimeType === 'image/gif' || file.name.toLowerCase().endsWith('.gif');

  // Read file as raw Data URL first
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as text/data URL'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader failed to read the image file'));
    reader.readAsDataURL(file);
  });

  // SVG and animated GIF are preserved directly without canvas recompression
  if (isSvg || isGif) {
    return {
      dataUrl: rawDataUrl,
      blob: file,
      name: file.name,
      format: isSvg ? 'SVG' : 'GIF',
      width: 1920,
      height: 1080,
      sizeBytes: file.size,
    };
  }

  // Load into HTMLImageElement to detect dimensions and perform smart optimization if needed
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const origWidth = img.naturalWidth || img.width;
      const origHeight = img.naturalHeight || img.height;

      // Max allowable dimension for wallpaper display (covers 4K smoothly)
      const MAX_DIMENSION = 2560;

      // If already within reasonable dimensions (< 2560px and < 4MB), keep original
      if (origWidth <= MAX_DIMENSION && origHeight <= MAX_DIMENSION && file.size < 4 * 1024 * 1024) {
        resolve({
          dataUrl: rawDataUrl,
          blob: file,
          name: file.name,
          format: mimeType.replace('image/', '').toUpperCase(),
          width: origWidth,
          height: origHeight,
          sizeBytes: file.size,
        });
        return;
      }

      // Calculate scaled dimensions while preserving aspect ratio
      let targetWidth = origWidth;
      let targetHeight = origHeight;
      if (origWidth > MAX_DIMENSION || origHeight > MAX_DIMENSION) {
        if (origWidth > origHeight) {
          targetWidth = MAX_DIMENSION;
          targetHeight = Math.round((origHeight * MAX_DIMENSION) / origWidth);
        } else {
          targetHeight = MAX_DIMENSION;
          targetWidth = Math.round((origWidth * MAX_DIMENSION) / origHeight);
        }
      }

      // Draw onto canvas for optimized storage and fast GPU decoding
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback to raw if canvas context unavailable
          resolve({
            dataUrl: rawDataUrl,
            blob: file,
            name: file.name,
            format: mimeType.replace('image/', '').toUpperCase(),
            width: origWidth,
            height: origHeight,
            sizeBytes: file.size,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Export as JPEG at 0.92 quality (superb balance of visual clarity and memory footprint)
        const targetMime = mimeType === 'image/png' ? 'image/png' : 'image/jpeg';
        const optimizedDataUrl = canvas.toDataURL(targetMime, 0.92);

        canvas.toBlob(
          (blob) => {
            const finalBlob = blob || file;
            resolve({
              dataUrl: optimizedDataUrl,
              blob: finalBlob,
              name: file.name,
              format: targetMime.replace('image/', '').toUpperCase(),
              width: targetWidth,
              height: targetHeight,
              sizeBytes: finalBlob.size,
            });
          },
          targetMime,
          0.92
        );
      } catch {
        // Fallback to original if canvas fails
        resolve({
          dataUrl: rawDataUrl,
          blob: file,
          name: file.name,
          format: mimeType.replace('image/', '').toUpperCase(),
          width: origWidth,
          height: origHeight,
          sizeBytes: file.size,
        });
      }
    };

    img.onerror = () => {
      // If image failed to load in element, still provide raw Data URL
      resolve({
        dataUrl: rawDataUrl,
        blob: file,
        name: file.name,
        format: mimeType.replace('image/', '').toUpperCase(),
        width: 1920,
        height: 1080,
        sizeBytes: file.size,
      });
    };

    img.src = rawDataUrl;
  });
}
