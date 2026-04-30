import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Download, 
  Maximize,
  Minimize,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CustomPdfViewerProps {
  fileUrl: string;
  title: string;
  className?: string;
}

const CustomPdfViewer: React.FC<CustomPdfViewerProps> = ({ 
  fileUrl, 
  title, 
  className = "" 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useIsMobile();

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      const element = document.querySelector('.pdf-container') as HTMLElement;
      if (element) {
        element.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = title;
    link.click();
  };

  const handleOpenInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  // Use Google Docs viewer for better mobile compatibility
  const getViewerUrl = () => {
    const encodedUrl = encodeURIComponent(fileUrl);
    // Google Docs viewer works better on mobile devices
    return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
  };

  return (
    <Card className={`${className} pdf-container`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PDF Viewer
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Open in New Tab</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Download</span>
            </Button>
            {!isMobile && (
              <Button variant="outline" size="sm" onClick={handleFullscreen}>
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="aspect-[4/3] w-full bg-muted rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
          <iframe
            src={getViewerUrl()}
            className="w-full h-full"
            title={title}
            style={{ border: 'none' }}
            allow="autoplay"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomPdfViewer;