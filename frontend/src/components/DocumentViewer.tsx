import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from '../lib/toast';
import { secureDownload } from '../lib/secureDownload';
import LogoSpinner from './LogoSpinner';
import { 
  Download, 
  Maximize,
  Minimize,
  FileText,
  File,
  FileSpreadsheet,
  X,
  Share2,
  Copy,
  Check
} from 'lucide-react';

interface DocumentViewerProps {
  fileUrl: string;
  title: string;
  fileName?: string;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  fileUrl, 
  title, 
  fileName,
  className = "",
  isOpen = false,
  onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const isMobile = window.innerWidth < 768;

  const handleShare = async () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: title,
      text: `Check out: ${title}`,
      url: currentUrl,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Link has been shared",
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const getFileExtension = (url: string) => {
    return url.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (url: string) => {
    const ext = getFileExtension(url);
    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'word';
      case 'xls':
      case 'xlsx':
        return 'excel';
      case 'ppt':
      case 'pptx':
        return 'powerpoint';
      default:
        return 'unknown';
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="h-12 w-12 text-red-500" />;
      case 'word':
        return <FileText className="h-12 w-12 text-blue-500" />;
      case 'excel':
        return <FileSpreadsheet className="h-12 w-12 text-green-500" />;
      case 'powerpoint':
        return <FileText className="h-12 w-12 text-orange-500" />;
      default:
        return <File className="h-12 w-12 text-gray-500" />;
    }
  };

  const getFileTypeName = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return 'PDF Document';
      case 'word':
        return 'Word Document';
      case 'excel':
        return 'Excel Spreadsheet';
      case 'powerpoint':
        return 'PowerPoint Presentation';
      default:
        return 'Document';
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      const element = document.querySelector('.document-viewer-container') as HTMLElement;
      if (element) {
        element.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const getDownloadFileName = () => {
    const extension = getFileExtension(fileUrl);
    let name = fileName || title;
    // Remove extension if already present to avoid double extension
    if (extension && name.toLowerCase().endsWith(`.${extension}`)) {
      return name;
    }
    return extension ? `${name}.${extension}` : name;
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      await secureDownload(fileUrl, getDownloadFileName(), (progress) => {
        setDownloadProgress(progress);
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };


  const fileType = getFileType(fileUrl);

  const renderViewer = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden">
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full"
              title={title}
              style={{ border: 'none' }}
            />
          </div>
        );
      
      case 'word':
        // Use Microsoft Office Online Viewer for Word documents
        return (
          <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              className="w-full h-full"
              title={title}
              style={{ border: 'none' }}
            />
          </div>
        );
      
      case 'excel':
        // Use Microsoft Office Online Viewer for Excel files
        return (
          <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              className="w-full h-full"
              title={title}
              style={{ border: 'none' }}
            />
          </div>
        );
      
      case 'powerpoint':
        // Use Microsoft Office Online Viewer for PowerPoint files
        return (
          <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
              className="w-full h-full"
              title={title}
              style={{ border: 'none' }}
            />
          </div>
        );
      
      default:
        return (
          <div className="aspect-[4/3] w-full bg-muted rounded-lg flex items-center justify-center flex-col p-4 text-center">
            {getFileIcon(fileType)}
            <p className="mt-4 mb-4">Preview not available for this file type.</p>
            <p className="text-sm text-muted-foreground mb-4">
              File type: {getFileTypeName(fileType)}
            </p>
            <Button onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download File
            </Button>
          </div>
        );
    }
  };

  const viewerContent = (
    <Card className={`${className} document-viewer-container`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">{getFileTypeName(fileType)} Viewer</CardTitle>
          <div className="flex items-center flex-wrap gap-2">
            <TooltipProvider>
              {/* Share Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleShare} className="h-8 px-2 sm:px-3">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
              
              {/* Copy Link Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-8 px-2 sm:px-3">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied!' : 'Copy Link'}</TooltipContent>
              </Tooltip>
              
              
              {/* Download */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="h-8 px-2 sm:px-3"
                  >
                    {isDownloading ? (
                      <>
                        <LogoSpinner size="sm" />
                        <span className="ml-2 text-xs">
                          {downloadProgress > 0 ? `${downloadProgress}%` : 'Loading...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline ml-2">Download</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>
              
              {/* Fullscreen */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleFullscreen} className="h-8 px-2">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent>
              </Tooltip>
              
              {onClose && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onClose} className="h-8 px-2">
                      <X className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderViewer()}
      </CardContent>
    </Card>
  );

  // If it's a dialog, wrap in Dialog component
  if (isOpen !== undefined && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">{title}</DialogTitle>
          </DialogHeader>
          {viewerContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise return as standalone component
  return viewerContent;
};

export default DocumentViewer; 