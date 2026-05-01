import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from '../lib/toast';
import { secureDownload } from '../lib/secureDownload';
import LogoSpinner from './LogoSpinner';
import {
  Download, Maximize, Minimize, FileText, File, FileSpreadsheet, X,
  Share2, Copy, Check, ExternalLink, RefreshCw, AlertCircle
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
  fileUrl, title, fileName, className = "", isOpen = false, onClose
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [viewerEngine, setViewerEngine] = useState<'office' | 'google'>('office');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [showFallbackHint, setShowFallbackHint] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeKeyRef = useRef(0);

  const clearHintTimer = () => { if (hintTimer.current) clearTimeout(hintTimer.current); };

  useEffect(() => () => clearHintTimer(), []);

  const resetIframeState = () => {
    iframeKeyRef.current += 1;
    setIframeLoading(true);
    setShowFallbackHint(false);
    clearHintTimer();
    // Show fallback hint after 9s if the document hasn't loaded properly
    hintTimer.current = setTimeout(() => setShowFallbackHint(true), 9000);
  };

  const switchToGoogle = () => {
    setViewerEngine('google');
    resetIframeState();
    toast({ title: 'Switched to Google Docs Viewer', description: 'Trying alternative viewer…' });
  };

  const switchToOffice = () => {
    setViewerEngine('office');
    resetIframeState();
    toast({ title: 'Switched to Office Online', description: 'Trying Microsoft viewer…' });
  };

  const handleShare = async () => {
    const shareData = { title, text: `Check out: ${title}`, url: window.location.href };
    if (navigator.share && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); } catch {}
    } else { handleCopyLink(); }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: 'Link copied', description: 'Link has been copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const getFileExtension = (url: string) => url.split('.').pop()?.toLowerCase() || '';

  const getFileType = (url: string) => {
    const ext = getFileExtension(url);
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'doc': case 'docx': return 'word';
      case 'xls': case 'xlsx': return 'excel';
      case 'ppt': case 'pptx': return 'powerpoint';
      default: return 'unknown';
    }
  };

  const getFileIcon = (ft: string) => {
    switch (ft) {
      case 'pdf': return <FileText className="h-12 w-12 text-red-500" />;
      case 'word': return <FileText className="h-12 w-12 text-blue-500" />;
      case 'excel': return <FileSpreadsheet className="h-12 w-12 text-green-500" />;
      case 'powerpoint': return <FileText className="h-12 w-12 text-orange-500" />;
      default: return <File className="h-12 w-12 text-gray-500" />;
    }
  };

  const getFileTypeName = (ft: string) => {
    switch (ft) {
      case 'pdf': return 'PDF Document';
      case 'word': return 'Word Document';
      case 'excel': return 'Excel Spreadsheet';
      case 'powerpoint': return 'PowerPoint Presentation';
      default: return 'Document';
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      const el = document.querySelector('.document-viewer-container') as HTMLElement;
      if (el) { el.requestFullscreen(); setIsFullscreen(true); }
    } else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  const getDownloadFileName = () => {
    const extension = getFileExtension(fileUrl);
    let name = fileName || title;
    if (extension && name.toLowerCase().endsWith(`.${extension}`)) return name;
    return extension ? `${name}.${extension}` : name;
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    try {
      await secureDownload(fileUrl, getDownloadFileName(), (p) => setDownloadProgress(p));
    } finally { setIsDownloading(false); setDownloadProgress(0); }
  };

  const fileType = getFileType(fileUrl);

  const renderOfficeViewer = () => {
    const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`;
    const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    const src = viewerEngine === 'office' ? officeUrl : googleUrl;
    const engineLabel = viewerEngine === 'office' ? 'Microsoft Office Online' : 'Google Docs Viewer';

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 flex-wrap gap-2">
          <span>Viewer: <span className="font-medium text-foreground">{engineLabel}</span></span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={viewerEngine === 'office' ? switchToGoogle : switchToOffice}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Try {viewerEngine === 'office' ? 'Google Viewer' : 'Office Online'}
            </button>
          </div>
        </div>

        <div
          className="relative w-full bg-muted rounded-lg overflow-hidden"
          style={{ height: isMobile ? '75vh' : '82vh', minHeight: '480px' }}
        >
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 gap-3">
              <LogoSpinner />
              <p className="text-sm text-muted-foreground">Loading document…</p>
              <p className="text-xs text-muted-foreground/70">This may take a moment</p>
            </div>
          )}

          <iframe
            key={`${viewerEngine}-${iframeKeyRef.current}`}
            src={src}
            className="w-full h-full"
            title={title}
            style={{ border: 'none' }}
            allow="fullscreen"
            onLoad={() => {
              setIframeLoading(false);
              clearHintTimer();
              // After load, wait 2s then show hint in case Office showed an error page
              hintTimer.current = setTimeout(() => setShowFallbackHint(true), 2500);
            }}
          />

          {/* Fallback hint bar at bottom */}
          {showFallbackHint && !iframeLoading && (
            <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 z-20">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span className="text-xs">Document not showing? Try another viewer or download.</span>
              </div>
              <div className="flex gap-2 shrink-0">
                {viewerEngine === 'office' ? (
                  <Button variant="outline" size="sm" onClick={switchToGoogle} className="h-7 text-xs px-2">
                    <RefreshCw className="w-3 h-3 mr-1" />Google Viewer
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={switchToOffice} className="h-7 text-xs px-2">
                    <RefreshCw className="w-3 h-3 mr-1" />Office Online
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading} className="h-7 text-xs px-2">
                  <Download className="w-3 h-3 mr-1" />
                  {isDownloading ? `${downloadProgress}%` : 'Download'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowFallbackHint(false)} className="h-7 w-7 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderViewer = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <div className="w-full bg-muted rounded-lg overflow-hidden" style={{ height: isMobile ? '75vh' : '82vh', minHeight: '480px' }}>
            <iframe
              src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
              className="w-full h-full"
              title={title}
              style={{ border: 'none' }}
              allow="fullscreen"
            />
          </div>
        );

      case 'word':
      case 'excel':
      case 'powerpoint':
        return renderOfficeViewer();

      default:
        return (
          <div className="w-full bg-muted rounded-lg flex items-center justify-center flex-col p-8 text-center" style={{ minHeight: '300px' }}>
            {getFileIcon(fileType)}
            <p className="mt-4 mb-2 font-medium">Preview not available for this file type.</p>
            <p className="text-sm text-muted-foreground mb-6">File type: {getFileTypeName(fileType)}</p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Button onClick={handleDownload} disabled={isDownloading}>
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? (downloadProgress > 0 ? `${downloadProgress}%` : 'Downloading…') : 'Download File'}
              </Button>
              <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />Open in Browser
              </Button>
            </div>
          </div>
        );
    }
  };

  // Trigger iframe state reset when fileUrl changes
  useEffect(() => {
    if (fileType !== 'pdf' && fileType !== 'unknown') resetIframeState();
  }, [fileUrl]);

  const viewerContent = (
    <Card className={`${className} document-viewer-container`}>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">{getFileTypeName(fileType)} Viewer</CardTitle>
          <div className="flex items-center flex-wrap gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleShare} className="h-8 px-2 sm:px-3">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Share</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-8 px-2 sm:px-3">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline ml-2">{copied ? 'Copied!' : 'Copy'}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? 'Copied!' : 'Copy Link'}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading} className="h-8 px-2 sm:px-3">
                    {isDownloading ? (
                      <><LogoSpinner size="sm" /><span className="ml-2 text-xs">{downloadProgress > 0 ? `${downloadProgress}%` : 'Loading…'}</span></>
                    ) : (
                      <><Download className="w-4 h-4" /><span className="hidden sm:inline ml-2">Download</span></>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')} className="h-8 px-2 sm:px-3">
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Open</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open in new tab</TooltipContent>
              </Tooltip>

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
      <CardContent>{renderViewer()}</CardContent>
    </Card>
  );

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

  return viewerContent;
};

export default DocumentViewer;
