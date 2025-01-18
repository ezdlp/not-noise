import imageCompression from 'browser-image-compression';

export type CompressionLevel = 'low' | 'medium' | 'high';

export interface CompressionSettings {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

export const getCompressionSettings = (level: CompressionLevel): CompressionSettings => {
  switch (level) {
    case 'low':
      return {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true
      };
    case 'medium':
      return {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true
      };
    case 'high':
      return {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
  }
};

export const compressImage = async (
  file: File, 
  level: CompressionLevel = 'medium',
  onProgress?: (progress: number) => void
): Promise<{ 
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
}> => {
  const settings = getCompressionSettings(level);
  
  try {
    const compressedFile = await imageCompression(file, {
      ...settings,
      onProgress,
    });

    return {
      compressedFile,
      originalSize: file.size,
      compressedSize: compressedFile.size
    };
  } catch (error) {
    console.error('Compression failed:', error);
    throw error;
  }
};