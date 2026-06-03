import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Send, CheckCircle } from 'lucide-react';

export function SetupGuide() {
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackType, setFeedbackType] = useState('bug');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    // Save feedback locally
    try {
      const existing = JSON.parse(localStorage.getItem('bext_feedback') || '[]');
      existing.push({
        id: Date.now().toString(),
        name: feedbackName,
        email: feedbackEmail,
        type: feedbackType,
        message: feedbackMessage,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('bext_feedback', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setFeedbackSent(true);
    setFeedbackName('');
    setFeedbackEmail('');
    setFeedbackMessage('');
    setTimeout(() => setFeedbackSent(false), 4000);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Нұсқаулық
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }} className="mb-4">
            Математика және Информатика пәндеріне арнайы оңтайландырылған білім беру платформасы
          </p>

          {/* Beta badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.2)',
              color: 'var(--primary)',
            }}
          >
            <span>🔬 BETA</span>
            <span>Математика • Информатика</span>
          </div>
        </div>

        {/* Beta Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
            <div>
              <h3 className="font-medium mb-2" style={{ color: '#D97706' }}>
                ⚠️ Бета нұсқа туралы ескерту
              </h3>
              <div className="space-y-1.5 text-sm" style={{ color: 'var(--muted-foreground)' }}>
                <p>
                  Бұл платформа қазіргі уақытта <strong>бета нұсқасында</strong> жұмыс істейді. 
                  Кейбір функциялар дұрыс жұмыс істемеуі мүмкін.
                </p>
                <p>
                  • Кейбір батырмалар немесе мүмкіндіктер әлі толық аяқталмаған болуы мүмкін
                </p>
                <p>
                  • AI жауаптары кейде қате немесе толық емес болуы мүмкін
                </p>
                <p>
                  • Деректер тек браузерде сақталады — кэшті тазалағанда жойылады
                </p>
                <p>
                  Қателік тапсаңыз, төменгі опрос арқылы хабарлаңыз. Біз тезірек түзетеміз! 🙏
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
          }}
        >
          <h3 className="font-medium mb-3" style={{ color: 'var(--foreground)' }}>
            🎯 Мүмкіндіктер
          </h3>
          <div className="space-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <p>
              • <strong>ИИ чат:</strong> Математика және Информатика бойынша сұрақтарға жауап, қадамдап шешу
            </p> 
            <p>
              • <strong>Флэш-карточкалар:</strong> ИИ немесе қолмен жасау, Лейтнер әдісі
            </p>
            <p>
              • <strong>Тесттер:</strong> ИИ немесе қолмен жасау, экспорт/импорт
            </p>
            <p>
              • <strong>Күнтізбе:</strong> Оқу кестесін жоспарлау және бақылау
            </p>
            <p>
              • <strong>Формулалар:</strong> Негізгі математика формулаларының анықтамасы
            </p>
          </div>
        </div>

        {/* API Setup */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(124, 58, 237, 0.06)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
          }}
        >
          <h3 className="font-medium mb-3" style={{ color: 'var(--foreground)' }}>
            🤖 OpenRouter API кілтін баптау
          </h3>
          <div className="space-y-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            <p>
              1.{' '}
              <a
                href="https://openrouter.ai"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary)' }}
                className="hover:underline"
              >
                openrouter.ai
              </a>{' '}
              сайтына өтіп тіркеліңіз
            </p>
            <p>2. Keys бөліміне өтіп жаңа API кілт жасаңыз (тегін $1 кредит беріледі)</p>
            <p>3. Баптаулар (⚙️) бетіне өтіп, API кілтін енгізіңіз</p>
            <p>4. Модельді таңдаңыз немесе &quot;Бәрін қолдану (Auto)&quot; опциясын пайдаланыңыз</p>
          </div>
        </div>

        {/* Google Forms Contact */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'rgba(16, 185, 129, 0.06)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
          }}
        >
          <h3 className="font-medium mb-3" style={{ color: 'var(--foreground)' }}>
            📬 Бізбен байланысу
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Қызмет немесе ұсыныс бойынша хабарласқыңыз келсе, төмендегі формаға жазыңыз.
          </p>
          <div className="rounded-2xl overflow-hidden border border-[var(--border)]">
            <iframe
              title="Bext AI байланыс формасы"
              src="https://docs.google.com/forms/d/e/1FAIpQLSfB3_zcObEqjIU36U0cE6PnPmgI9bUOHMTs0WpDRGeERJCCXQ/viewform?embedded=true"
              width="100%"
              height="560"
              className="border-0"
            />
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
            Егер форма жүктелмесе, осы сілтеме арқылы ашыңыз:{' '}
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfB3_zcObEqjIU36U0cE6PnPmgI9bUOHMTs0WpDRGeERJCCXQ/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--primary)' }}
            >
              Байланыс формасы
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
