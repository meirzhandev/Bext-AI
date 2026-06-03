import { useState, useRef } from 'react';
import {
  FileText,
  Sparkles,
  PenLine,
  Plus,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RotateCw,
  Trash2,
  Trophy,
  Share2,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageFormatter } from './MessageFormatter';
import type { TestQuestionData } from '../../lib/openrouter';

export interface TestQuestion extends TestQuestionData {
  id: string;
  subject?: string; // Добавлено поле для предмета
}

interface TestPanelProps {
  questions: TestQuestion[];
  onCreateAI: () => void;
  onCreateManual: () => void;
  onDelete: (id: string) => void;
  onEdit: (question: TestQuestion) => void;
  onImport?: (questions: TestQuestion[]) => void;
}

export function TestPanel({ questions, onCreateAI, onCreateManual, onDelete, onEdit, onImport }: TestPanelProps) {
  const [view, setView] = useState<'list' | 'quiz'>('list');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');
  const [showExplanation, setShowExplanation] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<TestQuestion | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(questions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bext-test-${Date.now()}.json`;
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

  const handleAnswer = (idx: number) => {
    const updated = [...selected];
    updated[currentQ] = idx;
    setSelected(updated);
  };

  const startEdit = (question: TestQuestion) => {
    setEditingId(question.id);
    setEditingQuestion({ ...question });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingQuestion(null);
  };

  const saveEdit = () => {
    if (!editingQuestion) return;
    onEdit(editingQuestion);
    setEditingId(null);
    setEditingQuestion(null);
  };

  const updateOption = (index: number, value: string) => {
    if (!editingQuestion) return;
    const nextOptions = [...editingQuestion.options];
    nextOptions[index] = value;
    setEditingQuestion({ ...editingQuestion, options: nextOptions });
  };

  const createTestCertificateImage = async (scorePercent: number) => {
    const width = 1300;
    const height = 900;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#0F172A');
    bg.addColorStop(0.5, '#1E293B');
    bg.addColorStop(1, '#4F46E5');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Decorative border
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Inner white background with rounded corners
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, 80, width - 160, height - 160);

    // Gold accent lines
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, 200);
    ctx.lineTo(width - 120, 200);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(120, 600);
    ctx.lineTo(width - 120, 600);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 52px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bext командасының тест сертификаты', width / 2, 170);

    ctx.textAlign = 'left';

    // Subtitle
    ctx.fillStyle = '#6B7280';
    ctx.font = '500 28px Inter, sans-serif';
    ctx.fillText('Сіз келесі нәтижеге қол жеткізді:', 120, 250);

    // Score display with circle
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(200, 350, 80, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${scorePercent}%`, 200, 370);

    ctx.textAlign = 'left';

    // Details
    ctx.fillStyle = '#111827';
    ctx.font = '600 30px Inter, sans-serif';
    ctx.fillText(`Дұрыс жауап: ${selected.filter((ans, i) => ans === questions[i]?.correctAnswer).length} / ${questions.length}`, 320, 330);
    ctx.fillText(`Тест сұрақтары: ${questions.length}`, 320, 380);

    // Progress bar
    ctx.fillStyle = '#E5E7EB';
    ctx.fillRect(120, 450, width - 360, 20);
    ctx.fillStyle = scorePercent >= 70 ? '#10B981' : scorePercent >= 50 ? '#F59E0B' : '#EF4444';
    ctx.fillRect(120, 450, (width - 360) * (scorePercent / 100), 20);

    // Grade
    const gradeText =
      scorePercent >= 90 ? 'Өте жақсы!' :
      scorePercent >= 70 ? 'Жақсы!' :
      scorePercent >= 50 ? 'Қанағаттанарлық' : 'Кемелдендіру керек';

    ctx.fillStyle = '#111827';
    ctx.font = '600 34px Inter, sans-serif';
    ctx.fillText(gradeText, 120, 520);

    // Description
    ctx.fillStyle = '#6B7280';
    ctx.font = '500 22px Inter, sans-serif';
    ctx.fillText('Bext командасы сіздің білімді жүйелі жинағаныңызды мойындайды.', 120, 570);

    // Date
    ctx.fillStyle = '#111827';
    ctx.font = '600 24px Inter, sans-serif';
    ctx.fillText('Дата: ' + new Date().toLocaleDateString('kk-KZ'), 120, 650);

    // Signature box
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(width - 440, height - 220, 320, 90);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('Bext командасы', width - 420, height - 175);

    // Trophy icon (simple representation)
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(width - 200, height - 150, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', width - 200, height - 140);

    ctx.textAlign = 'left';

    return canvas.toDataURL('image/png');
  };

  const createDetailedCertificateImage = async (scorePercent: number) => {
    const width = 1300;
    const height = 1000;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#0F172A');
    bg.addColorStop(0.5, '#1E293B');
    bg.addColorStop(1, '#4F46E5');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Decorative border
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 8;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Inner white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(80, 80, width - 160, height - 160);

    // Gold accent lines
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, 200);
    ctx.lineTo(width - 120, 200);
    ctx.stroke();

    // Title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Детальный тест сертификаты', width / 2, 170);

    ctx.textAlign = 'left';

    // Overall score
    ctx.fillStyle = '#6B7280';
    ctx.font = '500 26px Inter, sans-serif';
    ctx.fillText('Жалпы нәтиже:', 120, 250);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.fillText(`${scorePercent}%`, 320, 250);

    // Scores by subject
    ctx.fillStyle = '#6B7280';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillText('Пән бойынша баллдар:', 120, 300);

    // Group questions by subject
    const subjectScores: { [key: string]: { correct: number; total: number } } = {};
    questions.forEach((q, i) => {
      const subject = q.subject || 'Жалпы';
      if (!subjectScores[subject]) {
        subjectScores[subject] = { correct: 0, total: 0 };
      }
      subjectScores[subject].total++;
      if (selected[i] === q.correctAnswer) {
        subjectScores[subject].correct++;
      }
    });

    let yPos = 350;
    Object.entries(subjectScores).forEach(([subject, scores]) => {
      const percent = Math.round((scores.correct / scores.total) * 100);
      ctx.fillStyle = '#111827';
      ctx.font = '600 24px Inter, sans-serif';
      ctx.fillText(`${subject}: ${scores.correct}/${scores.total} (${percent}%)`, 120, yPos);
      yPos += 40;
    });

    // Progress bars for each subject
    yPos += 20;
    Object.entries(subjectScores).forEach(([subject, scores]) => {
      const percent = (scores.correct / scores.total) * 100;
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(120, yPos, width - 360, 20);
      ctx.fillStyle = percent >= 70 ? '#10B981' : percent >= 50 ? '#F59E0B' : '#EF4444';
      ctx.fillRect(120, yPos, (width - 360) * (percent / 100), 20);
      yPos += 40;
    });

    // Grade
    const gradeText =
      scorePercent >= 90 ? 'Өте жақсы!' :
      scorePercent >= 70 ? 'Жақсы!' :
      scorePercent >= 50 ? 'Қанағаттанарлық' : 'Кемелдендіру керек';

    ctx.fillStyle = '#111827';
    ctx.font = '600 30px Inter, sans-serif';
    ctx.fillText(`Баға: ${gradeText}`, 120, yPos + 20);

    // Date
    ctx.fillStyle = '#111827';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('Дата: ' + new Date().toLocaleDateString('kk-KZ'), 120, yPos + 80);

    // Signature
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(width - 440, height - 220, 320, 90);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText('Bext командасы', width - 420, height - 175);

    return canvas.toDataURL('image/png');
  };

  const handleDownloadTestCertificate = async (scorePercent: number) => {
    setShareMessage('');
    const imageData = await createTestCertificateImage(scorePercent);
    if (!imageData) {
      setShareMessage('Сертификатты жасау мүмкін болмады. Тағы бір рет көріңіз.');
      return;
    }

    const link = document.createElement('a');
    link.href = imageData;
    link.download = `bext-test-certificate-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareMessage('Тест сертификаты жүктелді. Жүктеп алып бөлісе аласыз.');
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  const handleDownloadDetailedCertificate = async (scorePercent: number) => {
    setShareMessage('');
    const imageData = await createDetailedCertificateImage(scorePercent);
    if (!imageData) {
      setShareMessage('Детальный сертификатты жасау мүмкін болмады. Тағы бір рет көріңіз.');
      return;
    }

    const link = document.createElement('a');
    link.href = imageData;
    link.download = `bext-detailed-test-certificate-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShareMessage('Детальный тест сертификаты жүктелді. Жүктеп алып бөлісе аласыз.');
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelected([]);
    setShowResults(false);
    setShowExplanation(false);
    setView('list');
  };

  const correctCount = selected.filter((ans, i) => ans === questions[i]?.correctAnswer).length;
  const scorePercent = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  // Empty
  if (questions.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(124,58,237,0.1)' }}
        >
          <FileText size={32} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Тест жоқ
        </h2>
        <p className="text-center mb-8" style={{ color: 'var(--muted-foreground)', maxWidth: '360px' }}>
          ИИ арқылы автоматты немесе қолмен тест сұрақтарын жасаңыз
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
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <h2 className="font-semibold" style={{ color: 'var(--foreground)', fontSize: '15px' }}>
              {questions.length} сұрақ
            </h2>
          </div>

          <div
            className="flex rounded-xl overflow-hidden p-0.5"
            style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
          >
            {(['list', 'quiz'] as const).map((v) => (
              <button
                key={v}
                onClick={() => { setView(v); if (v === 'quiz') { setCurrentQ(0); setSelected(new Array(questions.length).fill(undefined)); setShowResults(false); } }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: view === v ? 'var(--primary)' : 'transparent',
                  color: view === v ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {v === 'list' ? 'Тізім' : 'Тест тапсыру'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={handleExport}
            disabled={questions.length === 0}
            className="h-9 px-3 rounded-xl flex items-center gap-2 text-xs font-medium disabled:opacity-40"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title="Тестпен бөлісу"
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
            title="Басқа тест ашу"
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
      <div className="flex-1 overflow-y-auto">
        {view === 'list' ? (
          <div className="max-w-3xl mx-auto px-8 py-4 space-y-3">
            {questions.map((q, i) => (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group p-5 rounded-2xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--primary)' }}
                    >
                      {i + 1}
                    </span>
                    {editingId === q.id && editingQuestion ? (
                      <input
                        value={editingQuestion.question}
                        onChange={(e) => setEditingQuestion((prev) => prev ? { ...prev, question: e.target.value } : prev)}
                        className="w-full p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                        {q.question}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === q.id ? (
                      <>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1 rounded-xl text-xs font-medium"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                          Сақтау
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 rounded-xl text-xs font-medium"
                          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        >
                          Болдырмау
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(q)}
                          className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <PenLine size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(q.id)}
                          className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg flex-shrink-0"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingId === q.id && editingQuestion ? (
                  <div className="grid gap-3 ml-10">
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Жауап
                      </label>
                      <textarea
                        value={editingQuestion.explanation}
                        onChange={(e) => setEditingQuestion((prev) => prev ? { ...prev, explanation: e.target.value } : prev)}
                        className="w-full p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="grid gap-2">
                      {editingQuestion.options.map((opt, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-semibold"
                            style={{ background: 'rgba(124,58,237,0.1)', color: 'var(--primary)', border: '1px solid var(--border)' }}
                          >
                            {String.fromCharCode(65 + j)}
                          </span>
                          <input
                            value={opt}
                            onChange={(e) => updateOption(j, e.target.value)}
                            className="flex-1 p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Дұрыс жауап
                      </label>
                      <select
                        value={editingQuestion.correctAnswer}
                        onChange={(e) => setEditingQuestion((prev) => prev ? { ...prev, correctAnswer: Number(e.target.value) } : prev)}
                        className="w-full p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                      >
                        {editingQuestion.options.map((_, j) => (
                          <option key={j} value={j}>{String.fromCharCode(65 + j)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted-foreground)' }}>
                        Пән
                      </label>
                      <input
                        value={editingQuestion.subject ?? ''}
                        onChange={(e) => setEditingQuestion((prev) => prev ? { ...prev, subject: e.target.value } : prev)}
                        className="w-full p-3 rounded-xl border bg-[var(--input-background)] text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 ml-10">
                      {q.options.map((opt, j) => (
                        <div
                          key={j}
                          className="px-3 py-2 rounded-xl text-xs flex items-center gap-2"
                          style={{
                            background: j === q.correctAnswer ? 'rgba(16,185,129,0.08)' : 'var(--input-background)',
                            border: `1px solid ${j === q.correctAnswer ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
                            color: j === q.correctAnswer ? '#10B981' : 'var(--foreground)',
                          }}
                        >
                          {j === q.correctAnswer && <CheckCircle2 size={12} />}
                          {String.fromCharCode(65 + j)}. {opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div
                        className="mt-3 ml-10 px-3 py-2 rounded-xl text-xs"
                        style={{
                          background: 'rgba(124,58,237,0.06)',
                          color: 'var(--muted-foreground)',
                          border: '1px solid rgba(124,58,237,0.1)',
                        }}
                      >
                        💡 {q.explanation}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </div>
        ) : showResults ? (
          <ResultsView
            questions={questions}
            selected={selected}
            correctCount={correctCount}
            scorePercent={scorePercent}
            onReset={handleReset}
            onDownloadCertificate={() => handleDownloadTestCertificate(scorePercent)}
            onDownloadDetailedCertificate={() => handleDownloadDetailedCertificate(scorePercent)}
            shareMessage={shareMessage}
          />
        ) : (
          <QuizView
            questions={questions}
            currentQ={currentQ}
            selected={selected}
            showExplanation={showExplanation}
            onAnswer={handleAnswer}
            onNext={handleNext}
            onShowExplanation={() => setShowExplanation(true)}
          />
        )}
      </div>
    </div>
  );
}

function QuizView({
  questions,
  currentQ,
  selected,
  showExplanation,
  onAnswer,
  onNext,
  onShowExplanation,
}: {
  questions: TestQuestion[];
  currentQ: number;
  selected: number[];
  showExplanation: boolean;
  onAnswer: (i: number) => void;
  onNext: () => void;
  onShowExplanation: () => void;
}) {
  const q = questions[currentQ];
  const answered = selected[currentQ] !== undefined;
  const isCorrect = answered && selected[currentQ] === q.correctAnswer;
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <div className="max-w-2xl mx-auto px-8 py-6">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span style={{ color: 'var(--muted-foreground)' }}>
            Сұрақ {currentQ + 1} / {questions.length}
          </span>
          <span style={{ color: 'var(--muted-foreground)' }}>
            {Math.round(((currentQ) / questions.length) * 100)}%
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--input-background)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--primary)' }}
            animate={{ width: `${((currentQ) / questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <div
        className="p-6 rounded-2xl mb-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
          <MessageFormatter content={q.question} isDark={isDark} />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-5">
        {q.options.map((opt, j) => {
          let bg = 'var(--card)';
          let border = 'var(--border)';
          let color = 'var(--foreground)';
          let icon = null;

          if (answered) {
            if (j === q.correctAnswer) {
              bg = 'rgba(16,185,129,0.08)';
              border = 'rgba(16,185,129,0.4)';
              color = '#10B981';
              icon = <CheckCircle2 size={16} style={{ color: '#10B981', flexShrink: 0 }} />;
            } else if (j === selected[currentQ]) {
              bg = 'rgba(239,68,68,0.08)';
              border = 'rgba(239,68,68,0.3)';
              color = '#EF4444';
              icon = <XCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />;
            }
          } else if (selected[currentQ] === j) {
            bg = 'rgba(124,58,237,0.08)';
            border = 'var(--primary)';
            color = 'var(--primary)';
          }

          return (
            <motion.button
              key={j}
              onClick={() => !answered && onAnswer(j)}
              disabled={answered}
              className="w-full text-left px-5 py-4 rounded-xl flex items-center gap-3 text-sm transition-all"
              style={{ background: bg, border: `1px solid ${border}`, color }}
              whileHover={!answered ? { scale: 1.01 } : {}}
              whileTap={!answered ? { scale: 0.99 } : {}}
            >
              <span
                className="w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ borderColor: border }}
              >
                {String.fromCharCode(65 + j)}
              </span>
              <span className="flex-1">
                <MessageFormatter content={opt} isDark={isDark} />
              </span>
              {icon}
            </motion.button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {answered && showExplanation && q.explanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-5 px-4 py-3 rounded-xl text-sm"
            style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)',
              color: 'var(--muted-foreground)',
            }}
          >
            <div className="font-semibold mb-2">💡 Түсініктеме</div>
            <MessageFormatter content={q.explanation} isDark={isDark} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        {answered && q.explanation && !showExplanation && (
          <button
            onClick={onShowExplanation}
            className="h-11 px-5 rounded-xl text-sm"
            style={{
              background: 'var(--input-background)',
              border: '1px solid var(--border)',
              color: 'var(--muted-foreground)',
            }}
          >
            Түсіндірме
          </button>
        )}
        <motion.button
          onClick={onNext}
          disabled={!answered}
          className="flex-1 h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          whileHover={answered ? { scale: 1.01 } : {}}
          whileTap={answered ? { scale: 0.99 } : {}}
        >
          {currentQ < questions.length - 1 ? (
            <>Келесі <ChevronRight size={16} /></>
          ) : (
            'Аяқтау'
          )}
        </motion.button>
      </div>
    </div>
  );
}

function ResultsView({
  questions,
  selected,
  correctCount,
  scorePercent,
  onReset,
  onDownloadCertificate,
  onDownloadDetailedCertificate,
  shareMessage,
}: {
  questions: TestQuestion[];
  selected: number[];
  correctCount: number;
  scorePercent: number;
  onReset: () => void;
  onDownloadCertificate: () => void;
  onDownloadDetailedCertificate: () => void;
  shareMessage: string;
}) {
  const grade =
    scorePercent >= 90 ? 'Өте жақсы!' :
    scorePercent >= 70 ? 'Жақсы!' :
    scorePercent >= 50 ? 'Қанағаттанарлық' : 'Қайта оқыңыз';

  return (
    <div className="max-w-2xl mx-auto px-8 py-6">
      {/* Score card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center p-8 rounded-3xl mb-6"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(124,58,237,0.12)' }}
        >
          <Trophy size={40} style={{ color: 'var(--primary)' }} />
        </div>
        <div
          className="text-5xl font-bold mb-1"
          style={{ color: scorePercent >= 70 ? '#10B981' : scorePercent >= 50 ? '#F59E0B' : '#EF4444' }}
        >
          {scorePercent}%
        </div>
        <p className="text-xl font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
          {grade}
        </p>
        <p style={{ color: 'var(--muted-foreground)' }}>
          {correctCount} / {questions.length} дұрыс жауап
        </p>
      </motion.div>

      {/* Answers review */}
      <div className="space-y-3 mb-6">
        {questions.map((q, i) => {
          const isCorrect = selected[i] === q.correctAnswer;
          return (
            <div
              key={q.id}
              className="p-4 rounded-2xl"
              style={{
                background: 'var(--card)',
                border: `1px solid ${isCorrect ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.25)'}`,
              }}
            >
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                ) : (
                  <XCircle size={18} style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }} />
                )}
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                    {q.question}
                  </p>
                  {!isCorrect && selected[i] !== undefined && (
                    <p className="text-xs" style={{ color: '#EF4444' }}>
                      Сіздің жауабыңыз: {q.options[selected[i]]}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: '#10B981' }}>
                    Дұрыс жауап: {q.options[q.correctAnswer]}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <motion.button
        onClick={onReset}
        className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <RotateCw size={16} />
        Қайта бастау
      </motion.button>
      <motion.button
        onClick={onDownloadCertificate}
        className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-3"
        style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Trophy size={16} />
        Қарапайым сертификат
      </motion.button>
      <motion.button
        onClick={onDownloadDetailedCertificate}
        className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mt-3"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
      >
        <Trophy size={16} />
        Детальный сертификат
      </motion.button>
      {shareMessage && (
        <p className="text-xs mt-3 text-[var(--muted-foreground)]">{shareMessage}</p>
      )}
    </div>
  );
}
