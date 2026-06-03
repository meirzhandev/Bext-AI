import { useState, useRef } from 'react';
import { Layers, RotateCw, Plus, Sparkles, PenLine, Trash2, ChevronLeft, ChevronRight, Brain, Target, Share2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageFormatter } from './MessageFormatter';
import type { FlashcardData } from '../../lib/openrouter';

export interface Flashcard extends FlashcardData {
  id: string;
  leitnerBox?: number; // 1-5
  nextReview?: Date;
}

interface FlashcardsPanelProps {
  cards: Flashcard[];
  onCreateAI: () => void;
  onCreateManual: () => void;
  onDelete: (id: string) => void;
  onEdit: (card: Flashcard) => void;
  onImport?: (cards: Flashcard[]) => void;
}

export function FlashcardsPanel({ cards, onCreateAI, onCreateManual, onDelete, onEdit, onImport }: FlashcardsPanelProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [view, setView] = useState<'study' | 'list'>('study');
  const [studyResult, setStudyResult] = useState<Record<string, 'know' | 'dontknow'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(cards, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bext-cards-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported) && onImport) {
          onImport(imported);
        }
      } catch (err) {
        alert('Файлды оқу қатесі. JSON форматын тексеріңіз.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 200);
  };

  const handleResult = (result: 'know' | 'dontknow') => {
    if (currentCard) {
      setStudyResult((prev) => ({ ...prev, [currentCard.id]: result }));
    }
    handleNext();
  };

  const knownCount = Object.values(studyResult).filter((v) => v === 'know').length;
  const progress = cards.length > 0 ? Math.round((Object.keys(studyResult).length / cards.length) * 100) : 0;

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(124,58,237,0.1)' }}
        >
          <Layers size={32} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Карточкалар жоқ
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--muted-foreground)', maxWidth: '360px' }}>
          ИИ арқылы автоматты немесе қолмен карточкалар жасаңыз
        </p>
        <div className="flex gap-3">
          <motion.button
            onClick={onCreateAI}
            className="h-11 px-6 rounded-xl flex items-center gap-2 text-sm font-medium"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles size={16} />
            ИИ арқылы жасау
          </motion.button>
          <motion.button
            onClick={onCreateManual}
            className="h-11 px-6 rounded-xl flex items-center gap-2 text-sm font-medium"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <PenLine size={16} />
            Қолмен жасау
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="px-8 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--foreground)', fontSize: '15px' }}>
              {cards.length} карточка
            </h2>
          </div>

          {/* View toggle */}
          <div
            className="flex rounded-xl overflow-hidden p-0.5"
            style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
          >
            {(['study', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: view === v ? 'var(--primary)' : 'transparent',
                  color: view === v ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {v === 'study' ? 'Оқу' : 'Тізім'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={handleExport}
            disabled={cards.length === 0}
            className="h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-medium disabled:opacity-40"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Карточкамен бөлісу"
          >
            <Share2 size={13} />
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            className="h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-medium"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Басқа карточка ашу"
          >
            <Upload size={13} />
          </motion.button>
          <motion.button
            onClick={onCreateAI}
            className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-medium"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Sparkles size={14} />
            ИИ
          </motion.button>
          <motion.button
            onClick={onCreateManual}
            className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-medium"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={14} />
            Қосу
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'study' ? (
          <StudyView
            cards={cards}
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            studyResult={studyResult}
            progress={progress}
            knownCount={knownCount}
            onFlip={() => setIsFlipped(!isFlipped)}
            onNext={handleNext}
            onPrev={handlePrev}
            onResult={handleResult}
            onReset={() => { setStudyResult({}); setCurrentIndex(0); setIsFlipped(false); }}
          />
        ) : (
          <ListView cards={cards} onDelete={onDelete} onEdit={onEdit} />
        )}
      </div>
    </div>
  );
}

function StudyView({
  cards,
  currentIndex,
  isFlipped,
  studyResult,
  progress,
  knownCount,
  onFlip,
  onNext,
  onPrev,
  onResult,
  onReset,
}: {
  cards: Flashcard[];
  currentIndex: number;
  isFlipped: boolean;
  studyResult: Record<string, 'know' | 'dontknow'>;
  progress: number;
  knownCount: number;
  onFlip: () => void;
  onNext: () => void;
  onPrev: () => void;
  onResult: (r: 'know' | 'dontknow') => void;
  onReset: () => void;
}) {
  const card = cards[currentIndex];
  const allStudied = Object.keys(studyResult).length >= cards.length;
  const isDark = document.documentElement.classList.contains('dark');

  if (allStudied) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(124,58,237,0.12)' }}
          >
            <Brain size={40} style={{ color: 'var(--primary)' }} />
          </div>
        </motion.div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Сессия аяқталды!
        </h2>
        <p className="mb-2" style={{ color: 'var(--primary)' }}>
          {knownCount} / {cards.length} — білемін
        </p>
        <p className="text-sm mb-8 text-center" style={{ color: 'var(--muted-foreground)' }}>
          {knownCount >= cards.length * 0.8
            ? 'Керемет нәтиже!'
            : knownCount >= cards.length * 0.5
            ? 'Жақсы, тағы жаттықтырыңыз'
            : 'Материалды тағы қарап шығыңыз'}
        </p>
        <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-xs">
          {[
            { label: 'Білемін', value: knownCount, color: '#10B981' },
            { label: 'Білмеймін', value: cards.length - knownCount, color: '#EF4444' },
            { label: 'Жалпы', value: cards.length, color: 'var(--primary)' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center px-4 py-3 rounded-2xl"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="text-2xl font-semibold" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <motion.button
          onClick={onReset}
          className="h-11 px-8 rounded-xl font-medium text-sm flex items-center gap-2"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCw size={16} />
          Қайта бастау
        </motion.button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-4">
      {/* Progress */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: 'var(--muted-foreground)' }}>
            {currentIndex + 1} / {cards.length}
          </span>
          <div className="flex items-center gap-3">
            <span style={{ color: '#10B981' }}>✓ {knownCount}</span>
            <span style={{ color: 'var(--muted-foreground)' }}>•</span>
            <span style={{ color: '#EF4444' }}>
              ✗ {Object.values(studyResult).filter((v) => v === 'dontknow').length}
            </span>
          </div>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--input-background)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--primary)' }}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex) / cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-2xl mb-6"
        style={{ perspective: '1200px', cursor: 'pointer' }}
        onClick={onFlip}
      >
        <motion.div
          className="relative w-full"
          style={{ transformStyle: 'preserve-3d', height: '320px' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              background: 'var(--card)',
              border: '2px solid var(--primary)',
              boxShadow: '0 8px 32px rgba(124,58,237,0.12)',
            }}
          >
            <div
              className="text-xs font-medium mb-4 px-3 py-1 rounded-full"
              style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--primary)' }}
            >
              {card?.subject}
            </div>
            <div className="text-xl text-center font-medium" style={{ color: 'var(--foreground)' }}>
              <MessageFormatter content={card?.front || ''} isDark={isDark} />
            </div>
            <div className="absolute bottom-5 text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
              Бұру үшін басыңыз
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-3xl p-8 flex flex-col items-center justify-center"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, var(--primary), rgba(167,139,250,1))',
              boxShadow: '0 8px 32px rgba(124,58,237,0.25)',
            }}
          >
            <div className="text-xs font-medium mb-4 px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
              Жауап
            </div>
            <div className="text-xl text-center font-medium" style={{ color: 'white' }}>
              <MessageFormatter content={card?.back || ''} isDark={isDark} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 w-full max-w-2xl justify-between">
        <motion.button
          onClick={onPrev}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft size={18} style={{ color: 'var(--foreground)' }} />
        </motion.button>

        {isFlipped ? (
          <div className="flex gap-3">
            <motion.button
              onClick={() => onResult('dontknow')}
              className="h-11 px-6 rounded-xl font-medium text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Білмеймін
            </motion.button>
            <motion.button
              onClick={() => onResult('know')}
              className="h-11 px-6 rounded-xl font-medium text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Білемін
            </motion.button>
          </div>
        ) : (
          <motion.button
            onClick={onFlip}
            className="h-11 px-8 rounded-xl font-medium text-sm flex items-center gap-2"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RotateCw size={16} />
            Аудару
          </motion.button>
        )}

        <motion.button
          onClick={onNext}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight size={18} style={{ color: 'var(--foreground)' }} />
        </motion.button>
      </div>
    </div>
  );
}

function ListView({ cards, onDelete, onEdit }: { cards: Flashcard[]; onDelete: (id: string) => void; onEdit: (card: Flashcard) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const isDark = document.documentElement.classList.contains('dark');

  const startEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setEditingCard({ ...card });
  };

  const saveEdit = () => {
    if (!editingCard) return;
    onEdit(editingCard);
    setEditingId(null);
    setEditingCard(null);
  };

  return (
    <div className="h-full overflow-y-auto px-8 py-4">
      <div className="max-w-3xl mx-auto grid gap-3">
        {cards.map((card, i) => {
          const isEditing = editingId === card.id;
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group p-4 rounded-2xl"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--primary)' }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {isEditing ? (
                        <textarea
                          value={editingCard?.front ?? ''}
                          onChange={(e) => setEditingCard((prev) => prev ? { ...prev, front: e.target.value } : prev)}
                          className="w-full p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                          rows={2}
                        />
                      ) : (
                        <MessageFormatter content={card.front} isDark={isDark} />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                      >
                        Сақтау
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditingCard(null); }}
                        className="px-3 py-1 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                      >
                        Болдырмау
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(card)}
                        className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                        style={{ color: 'var(--foreground)' }}
                      >
                        <PenLine size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(card.id)}
                        className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                        style={{ color: '#EF4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid gap-3 ml-10">
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                    Жауабы
                  </div>
                  {isEditing ? (
                    <textarea
                      value={editingCard?.back ?? ''}
                      onChange={(e) => setEditingCard((prev) => prev ? { ...prev, back: e.target.value } : prev)}
                      className="w-full p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                      rows={2}
                    />
                  ) : (
                    <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      <MessageFormatter content={card.back} isDark={isDark} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--muted-foreground)' }}>
                    Пән
                  </div>
                  {isEditing ? (
                    <input
                      value={editingCard?.subject ?? ''}
                      onChange={(e) => setEditingCard((prev) => prev ? { ...prev, subject: e.target.value } : prev)}
                      className="w-full p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                    />
                  ) : (
                    <div
                      className="text-xs inline-block px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(124,58,237,0.08)', color: 'var(--primary)' }}
                    >
                      {card.subject}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
