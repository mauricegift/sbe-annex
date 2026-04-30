// Mobile Upload Utilities
// Fixes common issues with file uploads on mobile devices

export const logMobileUploadDebug = (stage: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const userAgent = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  console.log(`[Mobile Upload Debug] ${timestamp} - ${stage}`, {
    stage,
    data,
    isMobile,
    userAgent,
    location: window.location.href,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });
};

export const handleMobileNavigation = (navigate: any, path: string, delay = 1000) => {
  // Add delay to ensure proper navigation on mobile devices
  setTimeout(() => {
    logMobileUploadDebug('Navigation attempt', { path });
    navigate(path, { replace: true });
  }, delay);
};

// Check if device is mobile
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Check if device is iOS
export const isIOSDevice = (): boolean => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// Check if device is Android
export const isAndroidDevice = (): boolean => {
  return /Android/i.test(navigator.userAgent);
};

// Get proper accept attribute for mobile file inputs
export const getMobileAcceptAttribute = (type: 'image' | 'document' | 'all'): string => {
  switch (type) {
    case 'image':
      return 'image/*';
    case 'document':
      return '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';
    case 'all':
    default:
      return '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';
  }
};

// Create a mobile-friendly file input click handler
export const triggerMobileFileInput = (inputRef: React.RefObject<HTMLInputElement>) => {
  if (inputRef.current) {
    // Reset the input value to allow selecting the same file again
    inputRef.current.value = '';
    
    // Small delay for iOS to properly handle the click
    if (isIOSDevice()) {
      setTimeout(() => {
        inputRef.current?.click();
      }, 100);
    } else {
      inputRef.current.click();
    }
  }
};

// Normalize file from mobile input (handles blob URLs and camera captures)
export const normalizeFileForUpload = async (file: File): Promise<File> => {
  // If the file doesn't have a proper name (camera capture on some devices)
  if (!file.name || file.name === 'image.jpg' || file.name === 'blob') {
    const extension = file.type.split('/')[1] || 'jpg';
    const timestamp = Date.now();
    const newName = `upload_${timestamp}.${extension}`;
    return new File([file], newName, { type: file.type });
  }
  
  return file;
};

// Get file from mobile input event with proper error handling
export const getFileFromMobileInput = async (
  event: React.ChangeEvent<HTMLInputElement>
): Promise<File | null> => {
  try {
    const files = event.target.files;
    
    if (!files || files.length === 0) {
      logMobileUploadDebug('No files selected');
      return null;
    }
    
    const file = files[0];
    logMobileUploadDebug('File selected', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Normalize the file for upload
    const normalizedFile = await normalizeFileForUpload(file);
    
    return normalizedFile;
  } catch (error) {
    logMobileUploadDebug('Error getting file', { error });
    return null;
  }
};

// Mobile-optimized drag and drop handler (disabled on mobile)
export const handleMobileDrag = (e: React.DragEvent): boolean => {
  // Disable drag and drop on mobile as it doesn't work well
  if (isMobileDevice()) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  return true;
};
