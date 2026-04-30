import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, File, Image, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { cn } from '@/lib/utils';

interface FileUploadWithPreviewProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File) => boolean;
  selectedFile: File | null;
  onClear: () => void;
  label?: string;
  description?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  previewType?: 'image' | 'file' | 'auto';
  dragActive?: boolean;
  onDragStateChange?: (active: boolean) => void;
  className?: string;
}

export const FileUploadWithPreview: React.FC<FileUploadWithPreviewProps> = ({
  accept = '*/*',
  maxSize = 20,
  onFileSelect,
  selectedFile,
  onClear,
  label = 'Upload File',
  description = 'Drag and drop or click to select',
  isUploading = false,
  uploadProgress = 0,
  previewType = 'auto',
  dragActive = false,
  onDragStateChange,
  className,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [internalDragActive, setInternalDragActive] = useState(false);

  const isDragActive = dragActive || internalDragActive;

  // Generate preview URL for images
  useEffect(() => {
    if (selectedFile) {
      const isImage = selectedFile.type.startsWith('image/');
      const shouldPreview = previewType === 'image' || (previewType === 'auto' && isImage);
      
      if (shouldPreview && isImage) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    setPreviewUrl(null);
  }, [selectedFile, previewType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const active = e.type === 'dragenter' || e.type === 'dragover';
    setInternalDragActive(active);
    onDragStateChange?.(active);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setInternalDragActive(false);
    onDragStateChange?.(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isImage = selectedFile?.type.startsWith('image/');

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
          <p className="text-xs text-muted-foreground mt-1">Max size: {maxSize}MB</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-3">
          {/* Preview section */}
          {previewUrl ? (
            <div className="relative aspect-video w-full max-w-xs mx-auto overflow-hidden rounded-md bg-muted">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center p-4 bg-muted rounded-md">
              {isImage ? (
                <Image className="h-12 w-12 text-muted-foreground" />
              ) : (
                <File className="h-12 w-12 text-muted-foreground" />
              )}
            </div>
          )}
          
          {/* File info */}
          <div className="flex items-center justify-between">
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
                onClick={handleClear}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadWithPreview;
