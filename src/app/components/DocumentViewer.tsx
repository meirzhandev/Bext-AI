import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Document, Page, pdfjs } from 'react-pdf';
import { pdfWorkerSrc } from '../../lib/pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface DocumentViewerProps {
  fileData: string; // base64 or data URL
  fileName: string;
  fileType: 'pdf' | 'word' | 'text';
  fileContent?: string;
  onClose: () => void;
}

export function DocumentViewer({ fileData, fileName, fileType, fileContent, onClose }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(0.9);
  const [textContent, setTextContent] = useState('');
  const [viewerWidth, setViewerWidth] = useState(760);

  useEffect(() => {
    if (fileType === 'text') {
      // Decode base64 text
      try {
        const content = atob(fileData.split(',')[1] || fileData);
        setTextContent(content);
      } catch (e) {
        setTextContent(fileData);
      }
    }
  }, [fileData, fileType]);

  useEffect(() => {
    const updateWidth = () => {
      setViewerWidth(Math.min(760, window.innerWidth * 0.8));
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    link.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        className="w-full flex flex-col rounded-[28px] overflow-hidden"
        style={{ maxWidth: '880px', maxHeight: '88vh', boxShadow: '0 30px 90px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-3xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>
              {fileName}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              {fileType === 'pdf' && numPages > 0 && `${pageNumber} / ${numPages} бет`}
              {fileType === 'text' && 'Текст файл'}
              {fileType === 'word' && 'Word құжат'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {fileType === 'pdf' && (
              <>
                <button
                  onClick={() => setScale(Math.max(0.5, scale - 0.2))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
                >
                  <ZoomOut size={16} style={{ color: 'var(--foreground)' }} />
                </button>
                <button
                  onClick={() => setScale(Math.min(2.0, scale + 0.2))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
                >
                  <ZoomIn size={16} style={{ color: 'var(--foreground)' }} />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
            >
              <Download size={16} style={{ color: 'var(--foreground)' }} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
            >
              <X size={16} style={{ color: 'var(--foreground)' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-auto rounded-b-3xl"
          style={{ background: 'var(--background)', border: '1px solid var(--border)', borderTop: 'none' }}
        >
          {fileType === 'pdf' && (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <div
                className="rounded-3xl overflow-hidden"
                style={{ background: '#f8fafc', boxShadow: '0 20px 60px rgba(15,23,42,0.08)', border: '1px solid rgba(148,163,184,0.18)' }}
              >
                <Document file={fileData} onLoadSuccess={onDocumentLoadSuccess}>
                  <Page
                    pageNumber={pageNumber}
                    width={Math.max(300, viewerWidth * scale)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>
              </div>
            </div>
          )}

          {fileType === 'text' && (
            <div className="p-6">
              <pre
                className="whitespace-pre-wrap font-mono text-sm"
                style={{ color: 'var(--foreground)' }}
              >
                {fileContent || textContent}
              </pre>
            </div>
          )}

          {fileType === 'word' && (
            <div className="p-6">
              <pre
                className="whitespace-pre-wrap font-mono text-sm"
                style={{ color: 'var(--foreground)' }}
              >
                {fileContent || 'Құжат мәтіні алынбады'}
              </pre>
            </div>
          )}
        </div>

        {/* PDF Navigation */}
        {fileType === 'pdf' && numPages > 1 && (
          <div
            className="px-6 py-3 flex items-center justify-center gap-3 mt-2 rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
              style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
            >
              <ChevronLeft size={16} style={{ color: 'var(--foreground)' }} />
            </button>
            <span className="text-sm font-medium px-4" style={{ color: 'var(--foreground)' }}>
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-40"
              style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
            >
              <ChevronRight size={16} style={{ color: 'var(--foreground)' }} />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
