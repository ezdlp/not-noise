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