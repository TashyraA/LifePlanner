// Centralized image compression and storage utilities
import { indexedDB } from './indexedDB';

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB max per image
const COMPRESSION_QUALITY = 0.7; // JPEG quality for compression
const MAX_DIMENSION = 1200; // Max width or height in pixels (good for all screens)

export const compressImage = async (base64String: string): Promise<string> => {
  // If not a data URL, return as-is (external URL)
  if (!base64String.startsWith('data:')) return base64String;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if too large
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      // Try JPEG first, fallback to PNG
      let compressed = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);
      if (compressed.length > base64String.length) {
        compressed = canvas.toDataURL('image/png');
      }
      resolve(compressed);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64String;
  });
};

export const validateAndCompressImage = async (
  file: File,
  maxFileSizeMB: number = 2
): Promise<string> => {
  // Check file size before reading
  if (file.size > maxFileSizeMB * 1024 * 1024) {
    throw new Error(`File too large. Please choose an image under ${maxFileSizeMB}MB.`);
  }

  // Read file as base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  // Compress
  try {
    const compressed = await compressImage(base64);
    
    // If still too large after compression, reject
    if (compressed.length > MAX_IMAGE_SIZE * 2) {
      throw new Error(
        `Image too large (${Math.round(compressed.length / 1024)}KB). Please use a smaller or lower resolution image.`
      );
    }

    return compressed;
  } catch (error) {
    console.error('Compression failed:', error);
    throw new Error('Failed to process image. Please try a different image.');
  }
};

export const storeImageInIndexedDB = async (key: string, imageData: string): Promise<void> => {
  try {
    console.log(`Storing image in IndexedDB with key: ${key}`);
    await indexedDB.setItem(key, imageData);
    console.log('Image stored successfully');
  } catch (error) {
    console.error('Failed to store in IndexedDB:', error);
    throw new Error('Failed to save image. Storage may be full.');
  }
};

export const retrieveImageFromIndexedDB = async (key: string): Promise<string | undefined> => {
  try {
    return await indexedDB.getItem(key);
  } catch (error) {
    console.error('Failed to retrieve image from IndexedDB:', error);
    return undefined;
  }
};

export const removeImageFromIndexedDB = async (key: string): Promise<void> => {
  try {
    await indexedDB.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove image from IndexedDB:', error);
  }
};
