import { useState, useRef } from 'react';
import { X, Sparkles, PenLine, Upload, FileText, Image, Plus, Trash2, AlertCircle, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractTextFromPdfFile } from '../../lib/pdf';
import {
  generateFlashcardsFromContent,
  generateTestFromContent,
  type FlashcardData,
  type TestQuestionData,
} from '../../lib/openrouter';

// Исправленная функция extractTextFromFile с правильной загрузкой worker'а
async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isPdf = file.type === 'application/pdf' || ext === 'pdf';
  const isWord =
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword' ||
    ext === 'doc' ||
    ext === 'docx';

  if (isPdf) {
    try {
      const fullText = await extractTextFromPdfFile(file, { maxPages: 20 });

      if (!fullText.trim()) {
        throw new Error('PDF файлынан мәтін табылмады (суреттер құрамындағы PDF болуы мүмкін).');
      }
      
      return fullText.trim();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Белгісіз қателік';
      const errorMsg = `PDF қатесі: ${errMsg}. Балама: PDF-ні Word-ке айналдырыңыз немесе мәтінді қолмен көшіріңіз.`;
      throw new Error(errorMsg);
    }
  }

  if (isWord) {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      if (!result.value?.trim()) {
        throw new Error('Word құжатынан мәтін табылмады.');
      }
      
      return result.value.trim();
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : 'Белгісіз қателік';
      throw new Error(`Word қатесі: ${errMsg}. Мәтінді қолмен ұстап салыңыз.`);
    }
  }

  // Text file
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string)?.trim() || '';
      if (!text) {
        reject(new Error('Файл бос немесе оқылмады.'));
      } else {
        resolve(text);
      }
    };
    reader.onerror = () => reject(new Error('Файлды оқу қатесі.'));
    reader.readAsText(file);
  });
}


// ─── Flashcard Creation ───────────────────────────────────────────────────

interface CreateCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (cards: FlashcardData[]) => void;
  apiKey: string;
  model: string;
}

export function CreateCardsModal({ isOpen, onClose, onAdd, apiKey, model }: CreateCardsModalProps) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('Жалпы');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<FlashcardData[]>([]);

  // Manual mode
  const [manualCards, setManualCards] = useState<FlashcardData[]>([
    { front: '', back: '', subject: 'Жалпы' },
  ]);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    setContent(`[Файл оқылуда: ${file.name}...]`);
    
    try {
      const text = await extractTextFromFile(file);
      
      // Проверяем, успешно ли был извлечен текст
      if (!text || text.trim().length === 0) {
        setError('Файл бос немесе оқылуы мүмкін емес. Мәтінді қолмен ұстап салыңыз.');
        setContent('');
        return;
      }
      
      // Показываем сколько символов было извлечено
      setContent(text);
      if (text.length > 15000) {
        setError(`Назар аударыңыз: Файлдың біріңғай 15000 символы ғана пайдаланылатын болады (жалпы ${text.length} символ оқылды)`);
      }
    } catch (err: any) {
      console.error('File extraction error:', err);
      setError(err.message || 'Файлды оқу қатесі орын алды. Тағы бір рет көріңіз.');
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Мазмұн бос. Мәтін немесе файл жүктеңіз.');
      return;
    }
    
    if (content.length < 10) {
      setError('Мазмұн тым қысқа. Кем дегенде 10 символ қажет.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const cards = await generateFlashcardsFromContent(content, subject, count, apiKey, model);
      if (!cards || cards.length === 0) {
        setError('ИИ карточка жасай алмады. Мазмұнды тексеріңіз.');
        return;
      }
      setPreview(cards);
    } catch (e: any) {
      console.error('Generation error:', e);
      setError(e.message || 'Карточка жасау қатесі орын алды. API кілтін тексеріңіз немесе тағы бір рет көріңіз.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddManual = () => {
    setManualCards([...manualCards, { front: '', back: '', subject }]);
  };

  const handleRemoveManual = (i: number) => {
    setManualCards(manualCards.filter((_, idx) => idx !== i));
  };

  const handleSave = () => {
    if (mode === 'ai') {
      onAdd(preview);
    } else {
      const valid = manualCards.filter((c) => c.front.trim() && c.back.trim());
      onAdd(valid.map((c) => ({ ...c, subject })));
    }
    handleClose();
  };

  const handleClose = () => {
    setContent('');
    setPreview([]);
    setError('');
    setManualCards([{ front: '', back: '', subject: 'Жалпы' }]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-[101]"
            style={{ maxWidth: '640px', maxHeight: '90vh', margin: '0 16px' }}
          >
            <div
              className="rounded-3xl overflow-hidden flex flex-col"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                maxHeight: '90vh',
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-5 flex items-center justify-between flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Флэш-карточкалар жасау
                </h2>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
                >
                  <X size={16} style={{ color: 'var(--foreground)' }} />
                </button>
              </div>

              {/* Mode tabs */}
              <div className="px-6 pt-4 flex gap-2 flex-shrink-0">
                <ModeButton
                  active={mode === 'ai'}
                  onClick={() => setMode('ai')}
                  icon={<Sparkles size={15} />}
                  label="ИИ арқылы жасау"
                />
                <ModeButton
                  active={mode === 'manual'}
                  onClick={() => setMode('manual')}
                  icon={<PenLine size={15} />}
                  label="Қолмен жасау"
                />
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {mode === 'ai' ? (
                  <AICreateBody
                    content={content}
                    setContent={setContent}
                    subject={subject}
                    setSubject={setSubject}
                    count={count}
                    setCount={setCount}
                    loading={loading}
                    error={error}
                    preview={preview}
                    fileRef={fileRef}
                    onFileUpload={handleFileUpload}
                    onGenerate={handleGenerate}
                  />
                ) : (
                  <ManualCardsBody
                    cards={manualCards}
                    subject={subject}
                    setSubject={setSubject}
                    onUpdate={(i, field, val) => {
                      const updated = [...manualCards];
                      updated[i] = { ...updated[i], [field]: val };
                      setManualCards(updated);
                    }}
                    onAdd={handleAddManual}
                    onRemove={handleRemoveManual}
                  />
                )}
              </div>

              {/* Footer */}
              <div
                className="px-6 py-4 flex gap-3 flex-shrink-0"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  onClick={handleClose}
                  className="h-10 px-5 rounded-xl text-sm"
                  style={{
                    background: 'var(--input-background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  Бас тарту
                </button>
                <motion.button
                  onClick={handleSave}
                  disabled={
                    mode === 'ai'
                      ? preview.length === 0
                      : !manualCards.some((c) => c.front.trim() && c.back.trim())
                  }
                  className="flex-1 h-10 rounded-xl text-sm font-medium disabled:opacity-40"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {mode === 'ai'
                    ? `${preview.length} карточканы қосу`
                    : `${manualCards.filter((c) => c.front && c.back).length} карточканы қосу`}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Test Creation ────────────────────────────────────────────────────────

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (questions: TestQuestionData[]) => void;
  apiKey: string;
  model: string;
}

export function CreateTestModal({ isOpen, onClose, onAdd, apiKey, model }: CreateTestModalProps) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('Жалпы');
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<TestQuestionData[]>([]);

  // ҰБТ/ЕНТ standard: 5 options A, B, C, D, E
  const [manualQuestions, setManualQuestions] = useState<TestQuestionData[]>([
    { question: '', options: ['', '', '', '', ''], correctAnswer: 0, explanation: '' },
  ]);

  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    setContent(`[Файл оқылуда: ${file.name}...]`);
    
    try {
      const text = await extractTextFromFile(file);
      
      // Проверяем, успешно ли был извлечен текст
      if (!text || text.trim().length === 0) {
        setError('Файл бос немесе оқылуы мүмкін емес. Мәтінді қолмен ұстап салыңыз.');
        setContent('');
        return;
      }
      
      // Показываем сколько символов было извлечено
      setContent(text);
      if (text.length > 15000) {
        setError(`Назар аударыңыз: Файлдың біріңғай 15000 символы ғана пайдаланылатын болады (жалпы ${text.length} символ оқылды)`);
      }
    } catch (err: any) {
      console.error('File extraction error:', err);
      setError(err.message || 'Файлды оқу қатесі орын алды. Тағы бір рет көріңіз.');
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      setError('Мазмұн бос. Мәтін немесе файл жүктеңіз.');
      return;
    }
    
    if (content.length < 10) {
      setError('Мазмұн тым қысқа. Кем дегенде 10 символ қажет.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const questions = await generateTestFromContent(content, subject, count, apiKey, model);
      if (!questions || questions.length === 0) {
        setError('ИИ сұрақ жасай алмады. Мазмұнды тексеріңіз.');
        return;
      }
      setPreview(questions);
    } catch (e: any) {
      console.error('Generation error:', e);
      setError(e.message || 'Сұрақ жасау қатесі орын алды. API кілтін тексеріңіз немесе тағы бір рет көріңіз.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContent('');
    setPreview([]);
    setError('');
    setManualQuestions([{ question: '', options: ['', '', '', '', ''], correctAnswer: 0, explanation: '' }]);
    onClose();
  };

  const handleSave = () => {
    if (mode === 'ai') {
      onAdd(preview);
    } else {
      const valid = manualQuestions.filter((q) => q.question.trim() && q.options.some((o) => o.trim()));
      onAdd(valid);
    }
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-[101]"
            style={{ maxWidth: '640px', maxHeight: '90vh', margin: '0 16px' }}
          >
            <div
              className="rounded-3xl overflow-hidden flex flex-col"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
                maxHeight: '90vh',
              }}
            >
              <div
                className="px-6 py-5 flex items-center justify-between flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <h2 className="text-xl font-semibold" style={{ color: 'var(--foreground)' }}>
                  Тест жасау
                </h2>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
                >
                  <X size={16} style={{ color: 'var(--foreground)' }} />
                </button>
              </div>

              <div className="px-6 pt-4 flex gap-2 flex-shrink-0">
                <ModeButton
                  active={mode === 'ai'}
                  onClick={() => setMode('ai')}
                  icon={<Sparkles size={15} />}
                  label="ИИ арқылы жасау"
                />
                <ModeButton
                  active={mode === 'manual'}
                  onClick={() => setMode('manual')}
                  icon={<PenLine size={15} />}
                  label="Қолмен жасау"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {mode === 'ai' ? (
                  <AICreateBody
                    content={content}
                    setContent={setContent}
                    subject={subject}
                    setSubject={setSubject}
                    count={count}
                    setCount={setCount}
                    loading={loading}
                    error={error}
                    preview={preview.map((q) => ({ front: q.question, back: q.options[q.correctAnswer], subject }))}
                    fileRef={fileRef}
                    onFileUpload={handleFileUpload}
                    onGenerate={handleGenerate}
                    previewLabel="Жасалған сұрақтар"
                    isTest
                    testPreview={preview}
                  />
                ) : (
                  <ManualTestBody
                    questions={manualQuestions}
                    subject={subject}
                    setSubject={setSubject}
                    onUpdate={(i, updated) => {
                      const arr = [...manualQuestions];
                      arr[i] = updated;
                      setManualQuestions(arr);
                    }}
                    onAdd={() =>
                      setManualQuestions([
                        ...manualQuestions,
                        { question: '', options: ['', '', '', '', ''], correctAnswer: 0, explanation: '' },
                      ])
                    }
                    onRemove={(i) => setManualQuestions(manualQuestions.filter((_, idx) => idx !== i))}
                  />
                )}
              </div>

              <div
                className="px-6 py-4 flex gap-3 flex-shrink-0"
                style={{ borderTop: '1px solid var(--border)' }}
              >
                <button
                  onClick={handleClose}
                  className="h-10 px-5 rounded-xl text-sm"
                  style={{
                    background: 'var(--input-background)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                >
                  Бас тарту
                </button>
                <motion.button
                  onClick={handleSave}
                  disabled={mode === 'ai' ? preview.length === 0 : !manualQuestions.some((q) => q.question.trim())}
                  className="flex-1 h-10 rounded-xl text-sm font-medium disabled:opacity-40"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {mode === 'ai' ? `${preview.length} сұрақты қосу` : `${manualQuestions.filter((q) => q.question).length} сұрақты қосу`}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Shared Subcomponents ─────────────────────────────────────────────────

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{
        background: active ? 'var(--primary)' : 'var(--input-background)',
        color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
        border: `1px solid ${active ? 'transparent' : 'var(--border)'}`,
      }}
    >
      {icon}
      {label}
    </button>
  );
}

interface AICreateBodyProps {
  content: string;
  setContent: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  loading: boolean;
  error: string;
  preview: { front: string; back: string; subject: string }[];
  fileRef: React.RefObject<HTMLInputElement>;
  onFileUpload: (f: File) => void;
  onGenerate: () => void;
  previewLabel?: string;
  isTest?: boolean;
  testPreview?: TestQuestionData[];
}

function AICreateBody({
  content,
  setContent,
  subject,
  setSubject,
  count,
  setCount,
  loading,
  error,
  preview,
  fileRef,
  onFileUpload,
  onGenerate,
  previewLabel = 'Жасалған карточкалар',
  isTest = false,
  testPreview,
}: AICreateBodyProps) {
  return (
    <div className="space-y-4">
      {/* Subject + Count row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
            Тақырып
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="мысалы: Математика"
            className="w-full h-10 px-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--input-background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
            {isTest ? 'Сұрақ саны' : 'Карточка саны'}
          </label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full h-10 px-3 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--input-background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          >
            {[3, 5, 8, 10, 15].map((n) => (
              <option key={n} value={n}>
                {n} {isTest ? 'сұрақ' : 'карточка'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Text input */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Мазмұн (мәтін, кітап үзіндісі немесе тақырып)
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
              style={{
                background: 'var(--input-background)',
                border: '1px solid var(--border)',
                color: 'var(--muted-foreground)',
              }}
              title="PDF, Word, текст файл жүктеу"
            >
              <FileText size={12} />
              Файл (.pdf, .docx, .txt)
            </button>
          </div>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.csv,.pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFileUpload(f);
          }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Мәтін немесе тақырыпты осында жазыңыз... ИИ осы мазмұн бойынша карточкалар/тесттер жасайды"
          rows={5}
          className="w-full px-3 py-3 rounded-xl text-sm outline-none resize-none"
          style={{
            background: 'var(--input-background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#EF4444',
          }}
        >
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generate button */}
      <motion.button
        onClick={onGenerate}
        disabled={!content.trim() || loading}
        className="w-full h-11 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        whileHover={{ scale: loading ? 1 : 1.01 }}
        whileTap={{ scale: loading ? 1 : 0.98 }}
      >
        {loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-4 h-4 border-2 rounded-full"
              style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }}
            />
            ИИ жасап жатыр...
          </>
        ) : (
          <>
            <Sparkles size={16} />
            ИИ арқылы жасау
          </>
        )}
      </motion.button>

      {/* Preview */}
      {!isTest && preview.length > 0 && (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {previewLabel} ({preview.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {preview.map((card, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--input-background)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  {card.front}
                </div>
                <div style={{ color: 'var(--muted-foreground)' }}>{card.back}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isTest && testPreview && testPreview.length > 0 && (
        <div>
          <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
            {previewLabel} ({testPreview.length})
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {testPreview.map((q, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--input-background)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                  {i + 1}. {q.question}
                </div>
                {q.options.map((opt, j) => (
                  <div
                    key={j}
                    className="text-xs py-0.5"
                    style={{ color: j === q.correctAnswer ? 'var(--primary)' : 'var(--muted-foreground)' }}
                  >
                    {j === q.correctAnswer ? '✓ ' : '○ '}{opt}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ManualCardsBody({
  cards,
  subject,
  setSubject,
  onUpdate,
  onAdd,
  onRemove,
}: {
  cards: FlashcardData[];
  subject: string;
  setSubject: (v: string) => void;
  onUpdate: (i: number, field: string, val: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
          Тақырып
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="мысалы: Физика"
          className="w-full h-10 px-3 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--input-background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      <div className="space-y-3">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-4 rounded-xl"
            style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
                Карточка {i + 1}
              </span>
              {cards.length > 1 && (
                <button onClick={() => onRemove(i)}>
                  <Trash2 size={14} style={{ color: 'var(--muted-foreground)' }} />
                </button>
              )}
            </div>
            <input
              value={card.front}
              onChange={(e) => onUpdate(i, 'front', e.target.value)}
              placeholder="Алдыңғы жағы (сұрақ)"
              className="w-full h-9 px-3 rounded-lg text-sm outline-none mb-2"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
            <input
              value={card.back}
              onChange={(e) => onUpdate(i, 'back', e.target.value)}
              placeholder="Артқы жағы (жауап)"
              className="w-full h-9 px-3 rounded-lg text-sm outline-none"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="w-full h-10 rounded-xl text-sm flex items-center justify-center gap-2"
        style={{
          background: 'var(--input-background)',
          border: '1px dashed var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        <Plus size={15} />
        Карточка қосу
      </button>
    </div>
  );
}

function ManualTestBody({
  questions,
  subject,
  setSubject,
  onUpdate,
  onAdd,
  onRemove,
}: {
  questions: TestQuestionData[];
  subject: string;
  setSubject: (v: string) => void;
  onUpdate: (i: number, updated: TestQuestionData) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
          Тақырып
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="мысалы: Физика"
          className="w-full h-10 px-3 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--input-background)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        />
      </div>

      {questions.map((q, i) => (
        <div
          key={i}
          className="p-4 rounded-xl space-y-3"
          style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
              Сұрақ {i + 1}
            </span>
            {questions.length > 1 && (
              <button onClick={() => onRemove(i)}>
                <Trash2 size={14} style={{ color: 'var(--muted-foreground)' }} />
              </button>
            )}
          </div>
          <input
            value={q.question}
            onChange={(e) => onUpdate(i, { ...q, question: e.target.value })}
            placeholder="Сұрақ мәтіні"
            className="w-full h-9 px-3 rounded-lg text-sm outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          {q.options.map((opt, j) => (
            <div key={j} className="flex items-center gap-2">
              <button
                onClick={() => onUpdate(i, { ...q, correctAnswer: j })}
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: q.correctAnswer === j ? 'var(--primary)' : 'var(--border)',
                  background: q.correctAnswer === j ? 'var(--primary)' : 'transparent',
                }}
              >
                {q.correctAnswer === j && <div className="w-2 h-2 rounded-full bg-white" />}
              </button>
              <input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...q.options];
                  newOpts[j] = e.target.value;
                  onUpdate(i, { ...q, options: newOpts });
                }}
                placeholder={`${String.fromCharCode(65 + j)} нұсқа`}
                className="flex-1 h-9 px-3 rounded-lg text-sm outline-none"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={onAdd}
        className="w-full h-10 rounded-xl text-sm flex items-center justify-center gap-2"
        style={{
          background: 'var(--input-background)',
          border: '1px dashed var(--border)',
          color: 'var(--muted-foreground)',
        }}
      >
        <Plus size={15} />
        Сұрақ қосу
      </button>
    </div>
  );
}
