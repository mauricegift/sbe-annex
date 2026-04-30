// Image compression utility for mobile uploads
// Compresses images before upload to reduce file sizes and prevent network errors

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeMB: 1,
};

/**
 * Compress an image file to reduce size
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    return file;
  }
  
  // Skip if file is already small enough
  const maxSizeBytes = (opts.maxSizeMB || 1) * 1024 * 1024;
  if (file.size <= maxSizeBytes) {
    console.log('Image already small enough, skipping compression');
    return file;
  }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        let { width, height } = img;
        const maxWidth = opts.maxWidth || 1200;
        const maxHeight = opts.maxHeight || 1200;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new file with same name
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedFile.size / 1024).toFixed(1)}KB`);
            resolve(compressedFile);
          },
          'image/jpeg',
          opts.quality || 0.8
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress thumbnail specifically (smaller size, higher compression)
 */
export async function compressThumbnail(file: File): Promise<File> {
  return compressImage(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.7,
    maxSizeMB: 0.5,
  });
}
