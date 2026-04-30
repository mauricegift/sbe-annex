import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from './ui/button';
import { Upload, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  isMobileDevice, 
  isIOSDevice, 
  getMobileAcceptAttribute,
  getFileFromMobileInput,
  logMobileUploadDebug
} from '@/utils/mobileUploadFix';

interface MobileFileInputProps {
  onFileSelect: (file: File) => void;
  accept?: 'image' | 'document' | 'all';
  isUploading?: boolean;
  uploadProgress?: number;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  showCameraOption?: boolean;
  id?: string;
}

export interface MobileFileInputRef {
  trigger: () => void;
  reset: () => void;
}

const MobileFileInput = forwardRef<MobileFileInputRef, MobileFileInputProps>(({
  onFileSelect,
  accept = 'all',
  isUploading = false,
  uploadProgress = 0,
  buttonText = 'Select File',
  buttonVariant = 'outline',
  buttonSize = 'default',
  className,
  disabled = false,
  showCameraOption = false,
  id
}, ref) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const isMobile = isMobileDevice();
  const isIOS = isIOSDevice();

  useImperativeHandle(ref, () => ({
    trigger: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
        // Small delay for iOS
        if (isIOS) {
          setTimeout(() => fileInputRef.current?.click(), 100);
        } else {
          fileInputRef.current.click();
        }
      }
    },
    reset: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  }));

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    logMobileUploadDebug('File input change', { 
      hasFiles: !!event.target.files?.length 
    });
    
    const file = await getFileFromMobileInput(event);
    if (file) {
      onFileSelect(file);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      // Small delay for iOS to properly handle the click
      if (isIOS) {
        setTimeout(() => fileInputRef.current?.click(), 100);
      } else {
        fileInputRef.current.click();
      }
    }
  };

  const handleCameraClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      if (isIOS) {
        setTimeout(() => cameraInputRef.current?.click(), 100);
      } else {
        cameraInputRef.current.click();
      }
    }
  };

  const acceptAttribute = getMobileAcceptAttribute(accept);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* Main file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttribute}
        onChange={handleFileChange}
        className="hidden"
        id={id}
        disabled={disabled || isUploading}
      />
      
      {/* Camera input for mobile (only for images) */}
      {isMobile && showCameraOption && accept === 'image' && (
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
      )}

      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        className="touch-manipulation"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            {buttonText}
          </>
        )}
      </Button>

      {/* Camera button for mobile */}
      {isMobile && showCameraOption && accept === 'image' && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size={buttonSize}
          onClick={handleCameraClick}
          disabled={disabled}
          className="touch-manipulation"
        >
          <Camera className="h-4 w-4 mr-2" />
          Camera
        </Button>
      )}
    </div>
  );
});

MobileFileInput.displayName = 'MobileFileInput';

export default MobileFileInput;
