import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from '../lib/toast';
import { secureDownload } from '../lib/secureDownload';
import LogoSpinner from './LogoSpinner';
import {
  Download, Maximize, Minimize, FileText, File, FileSpreadsheet,
  X, Share2, Copy, Check, ExternalLink, RefreshCw, AlertCircle
} from 'lucide-react';

interface DocumentViewerProps {
  fileUrl: string;
  title: string;
  fileName?: string;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const viewerHeight = () => {
  if (typeof window === 'undefined') return '80vh';
  return window.innerWidth < 640 ? 'calc(100dvh - 160px)' : 'calc(100dvh - 220px)';
};

const getExt = (url: string) =>
  (url.split('?')[0].split('.').pop() || '').toLowerCase();

const getFileType = (url: string) => {
  const ext = getExt(url);
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';   // mammoth (Office Open XML)
  if (ext === 'doc')  return 'doc';    // old binary — Office Online / Google viewer
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  return 'unknown';
};

const getFileTypeName = (ft: string) =>
  ({
    pdf: 'PDF Document',
    docx: 'Word Document',
    doc: 'Word Document',
    excel: 'Excel Spreadsheet',
    powerpoint: 'PowerPoint Presentation',
    unknown: 'Document',
  }[ft] ?? 'Document');

const getFileIcon = (ft: string) => {
  if (ft === 'pdf')  return <FileText className="h-10 w-10 text-red-500" />;
  if (ft === 'docx' || ft === 'doc') return <FileText className="h-10 w-10 text-blue-500" />;
  if (ft === 'excel') return <FileSpreadsheet className="h-10 w-10 text-green-500" />;
  if (ft === 'powerpoint') return <FileText className="h-10 w-10 text-orange-500" />;
  return <File className="h-10 w-10 text-muted-foreground" />;
};

const BACKEND = 'https://bbmback.giftedtech.co.ke';
const proxyUrl = (original: string) =>
  `${BACKEND}/api/proxy-file?url=${encodeURIComponent(original)}`;

const ENGINE_LABELS: Record<string, string> = {
  office: 'Microsoft Office Online',
  google: 'Google Docs Viewer',
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  fileUrl, title, fileName, className = '', isOpen = false, onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const [viewerEngine, setViewerEngine] = useState<'office' | 'google'>('office');
  const [iframeLoading, setIframeLoading] = useState(true);
  const [showFallbackHint, setShowFallbackHint] = useState(false);
  const iframeKey = useRef(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mammoth state — only used for .docx
  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [wordLoading, setWordLoading] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);

  const fileType = getFileType(fileUrl);

  // ── Mammoth: render .docx only (mammoth does NOT support old binary .doc) ──
  useEffect(() => {
    if (fileType !== 'docx') return;
    setWordLoading(true);
    setWordHtml(null);
    setWordError(null);

    const load = async () => {
      // Try direct fetch first (works when CDN has CORS); proxy as fallback
      const urls = [fileUrl, proxyUrl(fileUrl)];
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (!res.ok) continue;
          const buf = await res.arrayBuffer();
          const mammoth = (await import('mammoth')).default ?? (await import('mammoth'));
          const result = await mammoth.convertToHtml({ arrayBuffer: buf });
          setWordHtml(result.value || '<p style="color:#888">Document appears empty.</p>');
          setWordLoading(false);
          return;
        } catch { /* try next */ }
      }
      // Both attempts failed — fall back to Office Online iframe
      setWordError('fallback-iframe');
      setWordLoading(false);
    };
    load();
  }, [fileUrl]);

  // ── Iframe hint timer ───────────────────────────────────────────────────────
  const clearHint = () => { if (hintTimer.current) clearTimeout(hintTimer.current); };
  const startHint = useCallback(() => {
    clearHint();
    setShowFallbackHint(false);
    setIframeLoading(true);
    hintTimer.current = setTimeout(() => setShowFallbackHint(true), 10000);
  }, []);
  useEffect(() => () => clearHint(), []);

  const switchEngine = (engine: 'office' | 'google') => {
    iframeKey.current += 1;
    setViewerEngine(engine);
    startHint();
    toast({ title: `Switched to ${ENGINE_LABELS[engine]}` });
  };

  // ── Share / Copy / Download ─────────────────────────────────────────────────
  const handleShare = async () => {
    const data = { title, text: `Check out: ${title}`, url: window.location.href };
    if (navigator.share && navigator.canShare?.(data)) {
      try { await navigator.share(data); return; } catch { /* fallthrough */ }
    }
    handleCopyLink();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast({ title: 'Link copied' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const getDownloadName = () => {
    const ext = getExt(fileUrl);
    const base = (fileName || title).replace(/\.[^/.]+$/, '');
    return ext ? `${base}.${ext}` : base;
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    try { await secureDownload(fileUrl, getDownloadName(), p => setDownloadProgress(p)); }
    finally { setIsDownloading(false); setDownloadProgress(0); }
  };

  const handleFullscreen = () => {
    const el = document.querySelector('.doc-viewer-root') as HTMLElement | null;
    if (!document.fullscreenElement && el) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ── Renderers ───────────────────────────────────────────────────────────────
  const renderPdf = () => (
    <div className="w-full rounded-lg overflow-hidden bg-muted" style={{ height: viewerHeight(), minHeight: 360 }}>
      <iframe
        src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
        className="w-full h-full"
        title={title}
        style={{ border: 'none' }}
        allow="fullscreen"
      />
    </div>
  );

  // Used for .docx (mammoth) — with fallback to iframe if mammoth fails
  const renderDocx = () => {
    if (wordLoading) return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <LogoSpinner />
        <p className="text-sm text-muted-foreground">Rendering document…</p>
      </div>
    );
    if (wordHtml) return (
      <div
        className="w-full overflow-auto rounded-lg bg-white text-black p-4 sm:p-8"
        style={{ height: viewerHeight(), minHeight: 320 }}
      >
        <style>{`
          .doc-html-content h1,.doc-html-content h2,.doc-html-content h3{font-weight:bold;margin:.75em 0 .35em}
          .doc-html-content h1{font-size:1.6em} .doc-html-content h2{font-size:1.3em} .doc-html-content h3{font-size:1.1em}
          .doc-html-content p{margin:.4em 0;line-height:1.7}
          .doc-html-content table{border-collapse:collapse;width:100%;margin:.5em 0}
          .doc-html-content td,.doc-html-content th{border:1px solid #ccc;padding:4px 8px}
          .doc-html-content ul,.doc-html-content ol{padding-left:1.5em;margin:.4em 0}
          .doc-html-content strong{font-weight:600} .doc-html-content em{font-style:italic}
        `}</style>
        <div className="doc-html-content text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: wordHtml }} />
      </div>
    );
    // Mammoth failed → silently fall through to Office Online iframe
    return renderOfficeIframe();
  };

  // Used for .doc, .pptx, .xlsx (and .docx fallback if mammoth fails)
  const renderOfficeIframe = () => {
    // Use the direct public URL for external viewers — jsDelivr and similar CDNs
    // are publicly accessible so Office Online/Google Docs can fetch them directly.
    // The proxy is only needed for in-browser mammoth fetching (CORS).
    const pUrl = fileUrl;
    const src = viewerEngine === 'office'
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pUrl)}`
      : `https://docs.google.com/viewer?url=${encodeURIComponent(pUrl)}&embedded=true`;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1 flex-wrap gap-2">
          <span>Viewer: <span className="font-medium text-foreground">{ENGINE_LABELS[viewerEngine]}</span></span>
          <div className="flex gap-3">
            {viewerEngine !== 'office' && (
              <button type="button" onClick={() => switchEngine('office')}
                className="text-primary hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />Office Online
              </button>
            )}
            {viewerEngine !== 'google' && (
              <button type="button" onClick={() => switchEngine('google')}
                className="text-primary hover:underline flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />Google Viewer
              </button>
            )}
          </div>
        </div>

        <div className="relative w-full rounded-lg overflow-hidden bg-muted" style={{ height: viewerHeight(), minHeight: 360 }}>
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10 gap-3">
              <LogoSpinner />
              <p className="text-sm text-muted-foreground">Loading document…</p>
            </div>
          )}

          <iframe
            key={`${viewerEngine}-${iframeKey.current}`}
            src={src}
            className="w-full h-full"
            title={title}
            style={{ border: 'none' }}
            allow="fullscreen"
            onLoad={() => {
              setIframeLoading(false);
              clearHint();
              hintTimer.current = setTimeout(() => setShowFallbackHint(true), 3000);
            }}
          />

          {showFallbackHint && !iframeLoading && (
            <div className="absolute bottom-0 inset-x-0 bg-background/95 backdrop-blur border-t border-border px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                Not displaying correctly?
              </span>
              <div className="flex gap-2">
                {viewerEngine === 'office'
                  ? <Button size="sm" variant="outline" onClick={() => switchEngine('google')} className="h-7 text-xs px-2"><RefreshCw className="w-3 h-3 mr-1" />Google Viewer</Button>
                  : <Button size="sm" variant="outline" onClick={() => switchEngine('office')} className="h-7 text-xs px-2"><RefreshCw className="w-3 h-3 mr-1" />Office Online</Button>}
                <Button size="sm" variant="outline" onClick={handleDownload} disabled={isDownloading} className="h-7 text-xs px-2">
                  <Download className="w-3 h-3 mr-1" />{isDownloading ? `${downloadProgress}%` : 'Download'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowFallbackHint(false)} className="h-7 w-7 p-0">
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderUnknown = () => (
    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center px-4">
      {getFileIcon('unknown')}
      <p className="font-medium">Preview not available</p>
      <p className="text-sm text-muted-foreground">This file type cannot be previewed in the browser.</p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Button onClick={handleDownload} disabled={isDownloading}>
          <Download className="w-4 h-4 mr-2" />{isDownloading ? `${downloadProgress}%` : 'Download'}
        </Button>
        <Button variant="outline" onClick={() => window.open(fileUrl, '_blank')}>
          <ExternalLink className="w-4 h-4 mr-2" />Open
        </Button>
      </div>
    </div>
  );

  const renderViewer = () => {
    switch (fileType) {
      case 'pdf':         return renderPdf();
      case 'docx':        return renderDocx();          // mammoth → fallback iframe
      case 'doc':                                        // old binary → iframe directly
      case 'powerpoint':
      case 'excel':       return renderOfficeIframe();
      default:            return renderUnknown();
    }
  };

  // Start iframe hint for non-mammoth types on mount
  useEffect(() => {
    if (['doc', 'powerpoint', 'excel'].includes(fileType)) startHint();
  }, [fileUrl]);

  // ── Toolbar ─────────────────────────────────────────────────────────────────
  const toolbar = (
    <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleShare} className="h-8 px-2 sm:px-3">
              <Share2 className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-8 px-2 sm:px-3">
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline ml-1.5">{copied ? 'Copied!' : 'Copy'}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{copied ? 'Copied!' : 'Copy Link'}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isDownloading} className="h-8 px-2 sm:px-3">
              {isDownloading
                ? <><LogoSpinner size="sm" /><span className="ml-1.5 text-xs hidden sm:inline">{downloadProgress > 0 ? `${downloadProgress}%` : '…'}</span></>
                : <><Download className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Download</span></>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Download</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')} className="h-8 px-2 sm:px-3">
              <ExternalLink className="w-4 h-4" /><span className="hidden sm:inline ml-1.5">Open</span>
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
  );

  const viewerContent = (
    <Card className={`${className} doc-viewer-root`}>
      <CardHeader className="pb-3 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm sm:text-base truncate max-w-[60vw] sm:max-w-xs">
            {getFileTypeName(fileType)} Viewer
          </CardTitle>
          {toolbar}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">{renderViewer()}</CardContent>
    </Card>
  );

  if (isOpen !== undefined && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[98vw] max-w-5xl max-h-[95dvh] overflow-y-auto p-2 sm:p-4">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base truncate">{title}</DialogTitle>
          </DialogHeader>
          {viewerContent}
        </DialogContent>
      </Dialog>
    );
  }

  return viewerContent;
};

export default DocumentViewer;
