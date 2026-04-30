import axios from 'axios';
import { showToast } from './toast';

/**
 * Get file extension from URL
 */
const getExtensionFromUrl = (url: string): string => {
  const urlWithoutParams = url.split('?')[0];
  const extension = urlWithoutParams.split('.').pop()?.toLowerCase();
  return extension || '';
};

/**
 * Get MIME type from filename extension
 */
const getMimeType = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  };
  
  return mimeTypes[extension || ''] || 'application/octet-stream';
};

/**
 * Ensures filename has the correct extension without duplication
 */
const ensureCorrectFileName = (fileName: string, fileUrl: string): string => {
  const urlExtension = getExtensionFromUrl(fileUrl);
  if (!urlExtension) return fileName;
  
  // Check if filename already ends with this extension (case-insensitive)
  if (fileName.toLowerCase().endsWith(`.${urlExtension}`)) {
    return fileName;
  }
  
  // Add extension if missing
  return `${fileName}.${urlExtension}`;
};

/**
 * Securely downloads a file by fetching it as a blob and triggering download.
 * This hides the original file URL from being exposed via long-press or context menu.
 */
export const secureDownload = async (
  fileUrl: string,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  // Ensure correct filename with proper extension
  const downloadFileName = ensureCorrectFileName(fileName, fileUrl);
  
  try {
    const response = await axios.get(fileUrl, {
      responseType: 'blob',
      timeout: 180000, // 3 minutes timeout
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(progress);
        } else if (onProgress && progressEvent.loaded) {
          // If total is unknown, show indeterminate progress based on loaded bytes
          onProgress(-1); // -1 indicates indeterminate
        }
      },
    });

    // Get content type from response or infer from filename
    const contentType = response.headers['content-type'] || getMimeType(downloadFileName);
    
    // Create blob with proper content type
    const blob = new Blob([response.data], { type: contentType });
    
    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = downloadFileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
  } catch (error) {
    console.error('Secure download failed:', error);
    showToast.error('Download failed. Please try again.');
    throw error;
  }
};
