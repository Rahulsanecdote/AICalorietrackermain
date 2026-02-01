import { useState, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ProgressPhoto } from '../types/analytics';
import { v4 as uuidv4 } from 'uuid';

const PHOTOS_STORAGE_KEY = 'act_progress_photos';
const MAX_IMAGE_WIDTH = 600;
const JPEG_QUALITY = 0.7;
const MAX_PHOTOS = 20; // Limit photos to prevent storage overflow

interface UseProgressPhotosReturn {
  photos: ProgressPhoto[];
  isLoading: boolean;
  error: string | null;
  uploadPhoto: (file: File, date?: string, weight?: number) => Promise<void>;
  deletePhoto: (id: string) => void;
  getPhotosByMonth: (year: number, month: number) => ProgressPhoto[];
  storageUsed: string;
  clearAll: () => void;
}

// Compress image using Canvas API
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if width exceeds max
        if (width > MAX_IMAGE_WIDTH) {
          height = (height * MAX_IMAGE_WIDTH) / width;
          width = MAX_IMAGE_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with quality setting
        const compressedDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export function useProgressPhotos(): UseProgressPhotosReturn {
  const [photos, setPhotos] = useLocalStorage<ProgressPhoto[]>(PHOTOS_STORAGE_KEY, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate approximate storage used (base64 strings)
  const storageUsed = photos.reduce((total, photo) => {
    return total + (photo.frontUrl?.length || 0) + (photo.sideUrl?.length || 0) + (photo.backUrl?.length || 0);
  }, 0);

  const formatStorageSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadPhoto = useCallback(async (file: File, date?: string, weight?: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check photo count limit
      if (photos.length >= MAX_PHOTOS) {
        // Remove oldest photo
        const sorted = [...photos].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setPhotos(sorted.slice(1));
      }

      // Compress the image
      const compressedUrl = await compressImage(file);

      const newPhoto: ProgressPhoto = {
        id: uuidv4(),
        date: date || (new Date().toISOString().split('T')[0] ?? new Date().toISOString()),
        frontUrl: compressedUrl,
        weightAtTime: weight,
        createdAt: new Date().toISOString(),
      };

      setPhotos((prev) =>
        [...prev, newPhoto].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsLoading(false);
    }
  }, [photos, setPhotos]);

  const deletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  }, [setPhotos]);

  const getPhotosByMonth = useCallback((year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    return photos.filter((photo) => photo.date.startsWith(monthStr));
  }, [photos]);

  const clearAll = useCallback(() => {
    if (confirm('Are you sure you want to delete all progress photos?')) {
      setPhotos([]);
    }
  }, [setPhotos]);

  return {
    photos,
    isLoading,
    error,
    uploadPhoto,
    deletePhoto,
    getPhotosByMonth,
    storageUsed: formatStorageSize(storageUsed),
    clearAll,
  };
}
