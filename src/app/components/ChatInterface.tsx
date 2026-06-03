import { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Send,
  X,
  Image,
  FileText,
  FileCode,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  RefreshCw,
  GraduationCap,
  Loader,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageFormatter } from './MessageFormatter';
import { DocumentViewer } from './DocumentViewer';
import { extractTextFromImage } from '../../lib/ocr';
import { cleanExtractedPdfText, extractTextFromPdfDocument, loadPdfDocument } from '../../lib/pdf';

export interface AttachedFile {
  name: string;
  type: 'image' | 'text' | 'pdf' | 'word';
  content: string; // base64 for images or extracted text for other file types
  size: number;
  mimeType: string;
  fileData?: string; // data URL or base64 for previewing PDF/Word
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: AttachedFile[];
  timestamp: Date;
  error?: boolean;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, attachments?: AttachedFile[]) => void;
  isThinking: boolean;
  apiKey: string;
  onRetry?: () => void;
  inputOnly?: boolean;
  teacherMode?: boolean;
  onToggleTeacher?: () => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="p-1.5 rounded-lg transition-all opacity-60 group-hover:opacity-100"
      style={{
        background: 'var(--input-background)',
        border: '1px solid var(--border)',
      }}
      title="Көшіру"
    >
      {copied ? (
        <Check size={13} style={{ color: '#10B981' }} />
      ) : (
        <Copy size={13} style={{ color: 'var(--muted-foreground)' }} />
      )}
    </button>
  );
}

function MessageBubble({ message, onExplainStep, onExtractText, onPreviewAttachment }: { message: Message; onExplainStep?: (stepNumber: number, stepContent: string) => void; onExtractText?: (url: string) => void; onPreviewAttachment?: (attach: AttachedFile) => void }) {
  const isUser = message.role === 'user';
  const isDark = document.documentElement.classList.contains('dark');
  const [extracting, setExtracting] = useState(false);

  const handleOCR = async (imageUrl: string) => {
    setExtracting(true);
    try {
      const result = await extractTextFromImage(imageUrl);
      if (onExtractText) {
        onExtractText(result.text);
      } else {
        alert(`📝 Фото бағалау нәтижесі:\n\n${result.text}`);
      }
    } catch (error: any) {
      alert(`OCR қатесі: ${error.message}`);
    } finally {
      setExtracting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      {!isUser && (
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 mt-0.5 glow-logo"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
        >
          <Sparkles size={13} color="white" />
        </div>
      )}

      <div className={`max-w-[72%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.attachments.map((att, i) => (
              <div key={i}>
                {att.type === 'image' ? (
                  <div className="relative group">
                    <img
                      src={att.content}
                      alt={att.name}
                      className="max-w-[240px] max-h-[200px] rounded-2xl object-cover"
                      style={{ border: '1px solid var(--border)' }}
                    />
                    {!isUser && (
                      <motion.button
                        type="button"
                        onClick={() => handleOCR(att.content)}
                        disabled={extracting}
                        className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                        style={{
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                        }}
                        title="Фото бағалау (OCR)"
                      >
                        {extracting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-4 h-4 border-2 rounded-full border-white border-t-transparent"
                          />
                        ) : (
                          <Eye size={16} />
                        )}
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                    style={{
                      background: isUser ? 'rgba(124,58,237,0.15)' : 'var(--input-background)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <FileText size={14} style={{ color: 'var(--primary)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate" style={{ color: 'var(--foreground)' }}>{att.name}</div>
                      <div className="text-[11px] opacity-70" style={{ color: 'var(--muted-foreground)' }}>
                        {(att.size / 1024).toFixed(1)} KB • {att.type.toUpperCase()}
                      </div>
                    </div>
                    {(att.type === 'pdf' || att.type === 'word' || att.type === 'text') && (
                      <button
                        type="button"
                        onClick={() => onPreviewAttachment?.(att)}
                        className="px-2 py-1 rounded-lg text-[11px] border border-current"
                        style={{ color: 'var(--foreground)' }}
                      >
                        Көрсету
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {message.content && (
          <div className="relative group">
            <div
              className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={{
                background: isUser ? 'var(--primary)' : 'var(--card)',
                color: isUser ? 'var(--primary-foreground)' : 'var(--foreground)',
                border: isUser ? 'none' : '1px solid var(--border)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              {message.error && (
                <div className="flex items-center gap-2 mb-2" style={{ color: '#EF4444' }}>
                  <AlertCircle size={14} />
                  <span className="text-xs font-medium">Қателік орын алды</span>
                </div>
              )}
              {isUser ? (
                <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
              ) : (
                <MessageFormatter 
                  content={message.content} 
                  isDark={isDark} 
                  onExplainStep={onExplainStep}
                />
              )}
            </div>

            {!isUser && !message.error && (
              <div className="absolute top-2 right-2">
                <CopyButton text={message.content} />
              </div>
            )}
          </div>
        )}

        <span
          className="text-xs px-1"
          style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}
        >
          {(() => {
            const timestamp =
              typeof message.timestamp === 'string' || typeof message.timestamp === 'number'
                ? new Date(message.timestamp)
                : message.timestamp;
            return timestamp.toLocaleTimeString('kk-KZ', { hour: '2-digit', minute: '2-digit' });
          })()}
        </span>
      </div>
    </motion.div>
  );
}

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start mb-6"
    >
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mr-3 glow-logo"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
      >
        <Sparkles size={13} color="white" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--primary)' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <span className="text-xs ml-1" style={{ color: 'var(--muted-foreground)' }}>
          Ойланып жатыр...
        </span>
      </div>
    </motion.div>
  );
}

export function ChatInterface({ messages, onSendMessage, isThinking, apiKey, onRetry, inputOnly, teacherMode, onToggleTeacher }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<AttachedFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ocrLoading, setOcrLoading] = useState<number | null>(null); // Index of image being OCR'd
  const fileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Файлды оқу мүмкін болмады'));
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file: File): Promise<AttachedFile | null> => {
    const isImage = file.type.startsWith('image/');
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    const CODE_EXTS = ['py', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'scss', 'json', 'xml', 'yaml', 'yml', 'md', 'txt', 'csv', 'sql', 'sh', 'bash', 'c', 'cpp', 'java', 'go', 'rs', 'php', 'rb', 'kt', 'swift', 'r'];
    const isCode = CODE_EXTS.includes(ext);
    const isPlainText = file.type.startsWith('text/') || isCode;
    const isPDF = file.type === 'application/pdf' || ext === 'pdf';
    const isWord = ['doc', 'docx'].includes(ext) || file.type.includes('word') || file.type.includes('wordprocessingml');

    // Check file size (images: 20MB, other docs: 50MB)
    const maxSize = isImage ? 20 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`"${file.name}" файлы өте ірі. Максимум ${isImage ? '20' : '50'} MB рұқсат етіледі.`);
      return null;
    }

    if (!isImage && !isPlainText && !isPDF && !isWord) {
      alert(`"${file.name}" файл түрі қолдау көрсетілмейді.`);
      return null;
    }

    // --- Image ---
    if (isImage) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          name: file.name,
          type: 'image',
          content: e.target?.result as string,
          fileData: e.target?.result as string,
          size: file.size,
          mimeType: file.type,
        });
        reader.readAsDataURL(file);
      });
    }

    // --- PDF ---
    if (isPDF) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await loadPdfDocument(arrayBuffer);
        let fullText = await extractTextFromPdfDocument(pdf, {
          maxPages: 30,
          includePageHeaders: false,
        });

        // If text extraction yielded almost nothing, fallback to OCR on first pages
        const minimalText = fullText.replace(/[-_\s\n]/g, '');
        if (minimalText.length < 20) {
          // perform OCR on first few pages (up to 5)
          const ocrPages = Math.min(5, pdf.numPages);
          let ocrText = '';
          for (let i = 1; i <= ocrPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) continue;
            await page.render({ canvasContext: ctx, viewport }).promise;
            const pageDataUrl = canvas.toDataURL('image/png');
            try {
              const ocrResult = await extractTextFromImage(pageDataUrl);
              ocrText += `--- OCR Бет ${i} ---\n${ocrResult.text}\n\n`;
            } catch (ocrErr) {
              console.warn('PDF OCR failed for page', i, ocrErr);
            }
          }
          if (ocrText.trim().length > 0) {
            fullText = cleanExtractedPdfText(ocrText);
          }
        }

        if (fullText.length > 12000) {
          fullText = fullText.substring(0, 12000) + `\n\n[Ескерту: PDF құжаты қысқартылды.]`;
        }

        return {
          name: file.name,
          type: 'pdf',
          content: fullText || '[PDF бос немесе тек суреттерден тұрады]',
          fileData: dataUrl,
          size: file.size,
          mimeType: 'application/pdf',
        };
      } catch (err: any) {
        console.error('PDF processing error:', err);
        alert(`PDF оқу қатесі: ${file.name}. Қате: ${err?.message || 'белгісіз қате'}`);
        return null;
      }
    }

    // --- Word (.doc / .docx) ---
    if (isWord) {
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        let text = result.value || '[Word құжаты бос]';
        
        if (text.length > 8000) {
          text = text.substring(0, 8000) + `\n\n[Ескерту: Word құжаты қысқартылды.]`;
        }
        
        return {
          name: file.name,
          type: 'word',
          content: text,
          fileData: dataUrl,
          size: file.size,
          mimeType: file.type,
        };
      } catch (e) {
        alert(`Word файлын оқу қатесі: ${file.name}`);
        return null;
      }
    }

    // --- Plain text / Code files ---
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        let content = e.target?.result as string;
        
        if (content.length > 8000) {
          content = content.substring(0, 8000) + `\n\n[Ескерту: Файл мазмұны қысқартылды.]`;
        }
        
        resolve({
          name: file.name,
          type: 'text',
          content,
          size: file.size,
          mimeType: file.type || 'text/plain',
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    });
  };

  const handlePreviewAttachment = (attach: AttachedFile) => {
    setPreviewAttachment(attach);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newAtts: AttachedFile[] = [];
    for (const file of Array.from(files)) {
      if (attachments.length + newAtts.length >= 4) break;
      const att = await processFile(file);
      if (att) newAtts.push(att);
    }
    setAttachments((prev) => [...prev, ...newAtts]);
  };

  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return;
    onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleExplainStep = (stepNumber: number, stepContent: string) => {
    const prompt = `${stepNumber}-қадамды толығырақ түсіндіріп беріңізші. Ондағы әрбір амалды не үшін және қалай жасағанымызды майдалап айтып беріңіз:\n\n"${stepContent.substring(0, 150)}..."`;
    onSendMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }

    // Detect Ctrl+V / Cmd+V and try to read clipboard (fallback if onPaste doesn't catch image)
    if ((e.ctrlKey || (e.metaKey ?? false)) && (e.key === 'v' || e.key === 'V')) {
      // attempt async clipboard read
      (async () => {
        try {
          // navigator.clipboard.read() requires secure context and permissions
          // try to read images/blobs from clipboard
          if (navigator.clipboard && (navigator.clipboard as any).read) {
            const items = await (navigator.clipboard as any).read();
            const files: File[] = [];
            for (const item of items) {
              for (const type of item.types) {
                if (type.startsWith('image/')) {
                  const blob = await item.getType(type);
                  const file = new File([blob], `pasted-image.${type.split('/')[1] || 'png'}`, { type });
                  files.push(file);
                }
              }
            }
            if (files.length > 0) {
              // prevent default paste handling
              e.preventDefault();
              const dataTransfer = new DataTransfer();
              files.forEach((f) => dataTransfer.items.add(f));
              await handleFiles(dataTransfer.files);
            }
          }
        } catch (err) {
          // ignore silently — fallback to onPaste handler will handle classic paste
          // console.debug('clipboard.read failed', err);
        }
      })();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await handleFiles(e.dataTransfer.files);
  };

  const handleExtractText = async (imageIndex: number, imageUrl: string) => {
    setOcrLoading(imageIndex);
    try {
      const result = await extractTextFromImage(imageUrl);
      // Add extracted text to input
      const newText = `[Фото бағалау нәтижесі]\n\n${result.text}\n\n`;
      setInput((prev) => newText + prev);
    } catch (error: any) {
      alert(`OCR қатесі: ${error.message}`);
    } finally {
      setOcrLoading(null);
    }
  };

  return (
    <div
      className={`flex flex-col ${inputOnly ? '' : 'h-full'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      {/* Messages area */}
      {!inputOnly && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 pt-6 pb-4">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                onExplainStep={handleExplainStep}
                onExtractText={(text) => setInput((prev) => `[Фото бағалау]\n\n${text}\n\n${prev}`)}
                onPreviewAttachment={handlePreviewAttachment}
              />
            ))}
            <AnimatePresence>
              {isThinking && <ThinkingIndicator />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '2px dashed var(--primary)',
            }}
          >
            <div className="text-center">
              <Paperclip size={32} style={{ color: 'var(--primary)', margin: '0 auto 8px' }} />
              <p className="font-medium" style={{ color: 'var(--primary)' }}>
                Файлды осында тастаңыз
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="px-6 pb-6">
        {!apiKey && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto mb-3 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: '#D97706',
            }}
          >
            <AlertCircle size={14} />
            <span>ИИ функциясы үшін Баптауларда OpenRouter API кілтін орнатыңыз</span>
          </motion.div>
        )}

        <div
          className="max-w-3xl mx-auto rounded-2xl overflow-hidden glow-input-wrap"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          {/* Attachments preview */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pt-3 flex flex-wrap gap-2 overflow-hidden"
              >
                {attachments.map((att, i) => (
                  <div key={i} className="relative group">
                    {att.type === 'image' ? (
                      <>
                        <img
                          src={att.content}
                          alt={att.name}
                          className="w-16 h-16 rounded-xl object-cover"
                          style={{ border: '1px solid var(--border)' }}
                        />
                        <motion.button
                          type="button"
                          onClick={() => handleExtractText(i, att.content)}
                          disabled={ocrLoading === i || isThinking}
                          className="absolute inset-0 rounded-xl flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                          style={{
                            background: 'rgba(0,0,0,0.6)',
                            color: 'white',
                          }}
                          title="Фото бағалау (OCR)"
                        >
                          {ocrLoading === i ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              className="w-4 h-4 border-2 rounded-full border-white border-t-transparent"
                            />
                          ) : (
                            <Eye size={14} />
                          )}
                        </motion.button>
                      </>
                    ) : (
                      <div
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: 'var(--input-background)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <FileText size={13} style={{ color: 'var(--primary)' }} />
                        <span
                          className="max-w-[100px] truncate"
                          style={{ color: 'var(--foreground)' }}
                        >
                          {att.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePreviewAttachment(att)}
                          className="rounded-lg border px-2 py-1 text-[11px]"
                          style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}
                        >
                          Көрсету
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity"
                      style={{ background: '#EF4444', color: 'white' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Text input row */}
          <div className="flex items-end gap-2 px-4 py-3">
            {/* Attach button */}
            <input
              ref={fileRef}
              type="file"
              multiple
              disabled={isThinking}
              accept="image/*,.txt,.md,.csv,.pdf,.doc,.docx,.py,.js,.ts,.tsx,.jsx,.html,.css,.scss,.json,.xml,.yaml,.yml,.sql,.sh,.c,.cpp,.java,.go,.rs,.php,.rb,.kt,.swift,.r"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <motion.button
              type="button"
              disabled={isThinking}
              onClick={() => fileRef.current?.click()}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 disabled:opacity-50"
              style={{
                background: 'var(--input-background)',
                border: '1px solid var(--border)',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Файл тіркеу"
            >
              <Paperclip size={16} style={{ color: 'var(--muted-foreground)' }} />
            </motion.button>

            {onToggleTeacher && (
              <motion.button
                type="button"
                onClick={onToggleTeacher}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5"
                style={{
                  background: teacherMode ? 'rgba(16,185,129,0.1)' : 'var(--input-background)',
                  border: `1px solid ${teacherMode ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Ұстаз режимі"
              >
                <GraduationCap size={16} style={{ color: teacherMode ? '#10B981' : 'var(--muted-foreground)' }} />
              </motion.button>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              placeholder={isThinking ? "Ойланып жатыр..." : "Сұрағыңызды жазыңыз... (Shift+Enter — жаңа жол)"}
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed disabled:opacity-50"
              style={{
                color: 'var(--foreground)',
                minHeight: '36px',
                maxHeight: '160px',
              }}
            />

            {/* Send button */}
            <motion.button
              onClick={handleSubmit}
              disabled={(!input.trim() && attachments.length === 0) || isThinking}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mb-0.5 disabled:opacity-35 transition-opacity glow-send"
              style={{ background: 'var(--primary)' }}
              whileHover={{ scale: input.trim() || attachments.length > 0 ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              title="Жіберу (Enter)"
            >
              <Send size={15} style={{ color: 'var(--primary-foreground)' }} />
            </motion.button>
          </div>

          <div
            className="px-4 pb-2 flex items-center justify-between"
          >
            <span className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
              Enter — жіберу • Shift+Enter — жаңа жол
            </span>
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
              <FileCode size={11} />
              Сурет, PDF, Word, код файлдары
            </span>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {previewAttachment && (
          <DocumentViewer
            key={previewAttachment.name}
            fileName={previewAttachment.name}
            fileType={previewAttachment.type === 'word' ? 'word' : previewAttachment.type === 'pdf' ? 'pdf' : 'text'}
            fileData={previewAttachment.fileData || previewAttachment.content}
            fileContent={previewAttachment.type === 'text' ? previewAttachment.content : undefined}
            onClose={() => setPreviewAttachment(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}