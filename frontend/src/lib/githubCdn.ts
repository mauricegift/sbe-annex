import axios from 'axios';
import { compressImage, compressThumbnail } from './imageCompression';

const GITHUB_CDN_URL = 'https://sbecdn.giftedtech.co.ke/api/upload.php';

// Check if device is mobile
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

function getFileContentType(ext: string): string {
  const types: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    
    // Videos
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.flv': 'video/x-flv',
    
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    
    // Code
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.php': 'application/x-httpd-php',
    '.py': 'text/x-python',
    '.java': 'text/x-java-source',
    '.c': 'text/x-csrc',
    '.cpp': 'text/x-c++src',
    '.h': 'text/x-chdr',
    
    // Other
    '.vcf': 'text/vcard',
    '.md': 'text/markdown',
    '.xml': 'application/xml',
    '.exe': 'application/x-msdownload',
    '.apk': 'application/vnd.android.package-archive',
    '.iso': 'application/x-iso9660-image',
  };
  
  return types[ext.toLowerCase()] || 'application/octet-stream';
}

function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot !== -1 ? filename.substring(lastDot) : '';
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface UploadOptions {
  compressImages?: boolean;
  isThumbnail?: boolean;
  maxRetries?: number;
}

// Retry upload with exponential backoff using fetch API for better mobile support
async function uploadWithRetry(
  formData: FormData,
  onProgress?: UploadProgressCallback,
  maxRetries: number = 3
): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt + 1}/${maxRetries}...`);
      
      // Use XMLHttpRequest for progress tracking (more reliable on mobile than axios)
      const result = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentCompleted = Math.round((e.loaded * 100) / e.total);
            onProgress(percentCompleted);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ data });
            } catch {
              resolve({ data: xhr.responseText });
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });
        
        xhr.addEventListener('timeout', () => {
          reject(new Error('Upload timed out'));
        });
        
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'));
        });
        
        // Increase timeout for mobile devices
        xhr.timeout = isMobileDevice() ? 180000 : 90000; // 3 min for mobile, 1.5 min for desktop
        
        xhr.open('POST', GITHUB_CDN_URL);
        xhr.send(formData);
      });
      
      return result;
    } catch (error: any) {
      lastError = error;
      console.log(`Upload attempt ${attempt + 1} failed:`, error.message);
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Upload failed after retries');
}

export async function uploadToGithubCdn(
  file: File, 
  filename?: string,
  onProgress?: UploadProgressCallback,
  options: UploadOptions = {}
): Promise<string> {
  const { compressImages = true, isThumbnail = false, maxRetries = 3 } = options;
  
  let fileToUpload = file;
  const finalFilename = filename || file.name;
  
  // Compress images on mobile devices to prevent network errors
  if (compressImages && file.type.startsWith('image/')) {
    try {
      console.log('Compressing image before upload...', { isMobile: isMobileDevice(), isThumbnail });
      
      if (isThumbnail) {
        fileToUpload = await compressThumbnail(file);
      } else if (isMobileDevice() || file.size > 2 * 1024 * 1024) {
        // Always compress on mobile or if file > 2MB
        fileToUpload = await compressImage(file, {
          maxWidth: isMobileDevice() ? 1600 : 2000,
          maxHeight: isMobileDevice() ? 1600 : 2000,
          quality: isMobileDevice() ? 0.7 : 0.85,
          maxSizeMB: isMobileDevice() ? 2 : 5,
        });
      }
      
      console.log(`Image compression: ${(file.size / 1024).toFixed(1)}KB -> ${(fileToUpload.size / 1024).toFixed(1)}KB`);
    } catch (compressionError) {
      console.warn('Image compression failed, uploading original:', compressionError);
      fileToUpload = file;
    }
  }
  
  const formData = new FormData();
  formData.append('file', fileToUpload, finalFilename);
  
  try {
    const response = await uploadWithRetry(formData, onProgress, maxRetries);
    
    const data = response.data;
    const url = data.rawUrl || data.url || data;
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid response from CDN server');
    }
    
    return url;
  } catch (error: any) {
    console.error('GitHub CDN upload error:', error);
    
    // Provide more helpful error messages for mobile users
    if (isMobileDevice()) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Upload timed out. Please check your internet connection and try again with a smaller file.');
      }
      if (error.message?.includes('Network Error')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Failed to upload file to CDN');
  }
}

// Convenience function for thumbnail uploads
export async function uploadThumbnail(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return uploadToGithubCdn(file, undefined, onProgress, { isThumbnail: true });
}

// Convenience function for profile picture uploads
export async function uploadProfilePicture(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  return uploadToGithubCdn(file, undefined, onProgress, { 
    compressImages: true,
    isThumbnail: true // Use thumbnail compression for profile pics
  });
}
