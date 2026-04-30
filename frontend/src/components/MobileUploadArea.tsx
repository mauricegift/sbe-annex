import React, { useRef } from 'react';
import { Upload, File, X, Loader2, Image } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';
import {
  isMobileDevice,
  isIOSDevice,
  getMobileAcceptAttribute,
  getFileFromMobileInput,
  handleMobileDrag,
  logMobileUploadDebug
} from '@/utils/mobileUploadFix';

interface MobileUploadAreaProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  accept?: 'image' | 'document' | 'all';
  isUploading?: boolean;
  uploadProgress?: number;
  previewUrl?: string | null;
  maxSize?: number; // in MB
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

const MobileUploadArea: React.FC<MobileUploadAreaProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
  accept = 'all',
  isUploading = false,
  uploadProgress = 0,
  previewUrl,
  maxSize = 20,
  label = 'Upload File',
  description,
  className,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = isMobileDevice();
  const isIOS = isIOSDevice();
  const [dragActive, setDragActive] = React.useState(false);

  const acceptAttribute = getMobileAcceptAttribute(accept);
  
  const defaultDescription = accept === 'image' 
    ? `Supports: JPG, PNG, WEBP (max ${maxSize}MB)`
    : accept === 'document'
    ? `Supports: PDF, DOC, DOCX, Images (max ${maxSize}MB)`
    : `Supports: PDF, DOC, DOCX, JPG, PNG, WEBP (max ${maxSize}MB)`;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    logMobileUploadDebug('Upload area file change');
    const file = await getFileFromMobileInput(event);
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current && !disabled && !isUploading) {
      fileInputRef.current.value = '';
      // Small delay for iOS
      if (isIOS) {
        setTimeout(() => fileInputRef.current?.click(), 100);
      } else {
        fileInputRef.current.click();
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!handleMobileDrag(e) || disabled || isUploading) return;
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (isMobile || disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      onFileSelect(file);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImageFile = selectedFile?.type.startsWith('image/');

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttribute}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {!selectedFile ? (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 touch-manipulation",
            "hover:border-primary hover:bg-accent/50",
            "active:scale-[0.98]",
            dragActive && "border-primary bg-accent/50",
            disabled && "opacity-50 cursor-not-allowed",
            "min-h-[120px] sm:min-h-[150px] flex flex-col items-center justify-center"
          )}
        >
          <Upload className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-3" />
          <p className="text-sm sm:text-base font-medium mb-1">
            {isMobile ? 'Tap to select file' : 'Click or drag file here'}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {description || defaultDescription}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          {/* Preview */}
          {previewUrl && isImageFile && (
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-32 sm:max-h-40 rounded-md object-contain"
              />
            </div>
          )}
          
          {/* File info */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 p-2 bg-muted rounded-md">
              {isImageFile ? (
                <Image className="h-5 w-5 text-muted-foreground" />
              ) : (
                <File className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            {!isUploading && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="flex-shrink-0 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  Uploading... {uploadProgress}%
                </span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileUploadArea;
