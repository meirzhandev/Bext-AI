import { useState } from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trophy, BookOpen, Flame, Target, CheckCircle2, Share2, Lock } from 'lucide-react';
import {
  CERTIFICATE_REQUIREMENTS,
  createAchievementCertificateCanvas,
  certificateCanvasToPngBlob,
  getCertificateRequirementText,
  meetsCertificateRequirements,
} from '../../lib/achievementCertificate';

export interface UserStats {
  testsCompleted: number;
  testsCorrectTotal: number;
  testsTotalQuestions: number;
  flashcardsReviewed: number;
  chatMessages: number;
  dailyStreak: number;
  lastActiveDate: string;
  activityHistory: { name: string; Орындалды: number }[];
  subjects: {
    [key: string]: { tests: number; cards: number; correct: number; total: number };
  };
}

export const defaultStats: UserStats = {
  testsCompleted: 0,
  testsCorrectTotal: 0,
  testsTotalQuestions: 0,
  flashcardsReviewed: 0,
  chatMessages: 0,
  dailyStreak: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  activityHistory: [
    { name: 'Дү', Орындалды: 0 },
    { name: 'Сe', Орындалды: 0 },
    { name: 'Сә', Орындалды: 0 },
    { name: 'Бе', Орындалды: 0 },
    { name: 'Жұ', Орындалды: 0 },
    { name: 'Сн', Орындалды: 0 },
    { name: 'Жк', Орындалды: 0 },
  ],
  subjects: {
    math: { tests: 0, cards: 0, correct: 0, total: 0 },
    cs: { tests: 0, cards: 0, correct: 0, total: 0 },
  },
};

interface DashboardProps {
  stats: UserStats;
}

export function Dashboard({ stats }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'math' | 'cs'>('all');

  const [shareMessage, setShareMessage] = useState<string>('');
  const [isSharing, setIsSharing] = useState(false);

  const accuracy = stats.testsTotalQuestions > 0 
    ? Math.round((stats.testsCorrectTotal / stats.testsTotalQuestions) * 100) 
    : 0;

  const subjectsData = stats.subjects || {};
  const subjectData = activeTab === 'all' ? null : subjectsData[activeTab];
  
  const displayAccuracy = subjectData && subjectData.total > 0 
    ? Math.round((subjectData.correct / subjectData.total) * 100)
    : activeTab === 'all' ? accuracy : 0;

  const activityHistory = stats.activityHistory || defaultStats.activityHistory;

  const totalTasks = activityHistory.reduce((sum, item) => sum + (item.Орындалды || 0), 0);
  const streakTitle = stats.dailyStreak >= 365 
    ? 'Супер Оқушы' 
    : stats.dailyStreak >= 180 
      ? 'Үздік Оқушы' 
      : stats.dailyStreak >= 30 
        ? 'Жақсы Жинақтаушы' 
        : stats.dailyStreak > 0 
          ? 'Жаңадан бастаушы' 
          : 'Бастауға дайынсың';

  const streakDescription = stats.dailyStreak >= 365
    ? '1 жыл үздік біліммен. Bext командасынан ресми сертификатқа лайықсың.'
    : stats.dailyStreak >= 180
      ? '6 ай үздіксіз оқу. Бастысы тоқтамау – ресми сертификатқа жол ашылады.'
      : stats.dailyStreak >= 30
        ? 'Ай бойы үздіксіз оқу. Мини сертификатқа және жүйелі прогреске жақынсың.'
        : stats.dailyStreak > 0
          ? 'Алғашқы күндер. Күн сайын оқып, сертификат деңгейін арттыра бер.'
          : 'Алғашқы тапсырманы бастаңыз, сонда сертификат және жетістік хабарламалары қосылады.';

  const certificateProgress = {
    dailyStreak: stats.dailyStreak,
    accuracy: displayAccuracy,
    testsCompleted: stats.testsCompleted,
  };

  const hasNormalProgress = meetsCertificateRequirements(certificateProgress);
  const progressRequirementText = getCertificateRequirementText();

  const certificateChecks = [
    {
      label: `Стрик: ${stats.dailyStreak}/${CERTIFICATE_REQUIREMENTS.minDailyStreak} күн`,
      done: stats.dailyStreak >= CERTIFICATE_REQUIREMENTS.minDailyStreak,
    },
    {
      label: `Дәлдік: ${displayAccuracy}/${CERTIFICATE_REQUIREMENTS.minAccuracy}%`,
      done: displayAccuracy >= CERTIFICATE_REQUIREMENTS.minAccuracy,
    },
    {
      label: `Тест: ${stats.testsCompleted}/${CERTIFICATE_REQUIREMENTS.minTestsCompleted}`,
      done: stats.testsCompleted >= CERTIFICATE_REQUIREMENTS.minTestsCompleted,
    },
  ];

  const handleShareAchievement = async () => {
    setShareMessage('');
    if (!hasNormalProgress) {
      setShareMessage(progressRequirementText);
      return;
    }

    setIsSharing(true);
    try {
      const shareText =
        `Менің Bext сертификатым: ${stats.dailyStreak} күн стрик, ${displayAccuracy}% дәлдік, ${stats.testsCompleted} тест.`;

      const certificateCanvas = createAchievementCertificateCanvas({
        streakTitle,
        dailyStreak: stats.dailyStreak,
        accuracy: displayAccuracy,
        testsCompleted: stats.testsCompleted,
        flashcardsReviewed: stats.flashcardsReviewed,
        totalWeeklyTasks: totalTasks,
      });

      if (!certificateCanvas) {
        setShareMessage('Сертификатты жасау мүмкін болмады. Тағы бір рет көріңіз.');
        return;
      }

      const imageData = certificateCanvas.toDataURL('image/png');
      const imageBlob = await certificateCanvasToPngBlob(certificateCanvas);

      if (navigator.share && imageBlob) {
        const file = new File([imageBlob], `bext-certificate-${Date.now()}.png`, {
          type: 'image/png',
        });
        const canShareWithFiles =
          typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });

        try {
          if (canShareWithFiles) {
            await navigator.share({
              title: 'Менің Bext сертификатым',
              text: shareText,
              files: [file],
            });
            setShareMessage('PNG сертификат табысты бөлісілді!');
            return;
          }

          await navigator.share({
            title: 'Менің Bext сертификатым',
            text: shareText,
          });
          setShareMessage('Мәтін бөлісілді. PNG жүктеп алып, желіге жүктей аласыз.');
          return;
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') return;
        }
      }

      const link = document.createElement('a');
      link.href = imageData;
      link.download = `bext-certificate-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShareMessage('PNG сертификат жүктелді. Оны әлеуметтік желіге жүктеп бөлісе аласыз.');
    } finally {
      setIsSharing(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'Жалпы' },
    { id: 'math', label: 'Математика' },
    { id: 'cs', label: 'Информатика' },
  ] as const;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header & Tabs */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              Менің жетістіктерім
            </h1>
            <p style={{ color: 'var(--muted-foreground)' }}>
              Күнделікті прогресс пен статистикаңыз
            </p>
          </div>
          
          <div className="flex bg-[var(--input-background)] p-1 rounded-xl border border-[var(--border)] self-start md:self-auto overflow-x-auto max-w-full">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap"
                style={{
                  background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0 }} className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-500">
                <Flame size={20} />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Стрик (күн)</p>
            </div>
            <p className="text-3xl font-bold text-[var(--foreground)]">{stats.dailyStreak}</p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-500">
                <Target size={20} />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Орташа балл</p>
            </div>
            <p className="text-3xl font-bold text-[var(--foreground)]">{displayAccuracy}%</p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-500">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Орындалған тест</p>
            </div>
            <p className="text-3xl font-bold text-[var(--foreground)]">
              {activeTab === 'all' ? stats.testsCompleted : subjectData?.tests || 0}
            </p>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500">
                <BookOpen size={20} />
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">Қаралған карточка</p>
            </div>
            <p className="text-3xl font-bold text-[var(--foreground)]">
              {activeTab === 'all' ? stats.flashcardsReviewed : subjectData?.cards || 0}
            </p>
          </motion.div>
        </div>

        {/* Charts & Bottom section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] lg:col-span-2">
            <h3 className="font-semibold text-[var(--foreground)] mb-6">Жеті күндік белсенділік</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} dy={10} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'var(--muted)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', background: 'var(--popover)', color: 'var(--popover-foreground)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  />
                  <Bar dataKey="Орындалды" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 relative" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              <div className="absolute inset-1 rounded-full bg-[var(--card)] flex items-center justify-center">
                <Trophy size={40} className="text-[var(--primary)]" />
              </div>
            </div>
            <h3 className="font-bold text-xl text-[var(--foreground)] mb-2">{streakTitle}</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              {streakDescription}
            </p>
            <p className="text-sm font-medium text-[var(--foreground)] mb-4">
              {totalTasks > 0 ? `Сіз соңғы 7 күннің ішінде ${totalTasks} тапсырма орындадыңыз.` : 'Әлі тапсырмалар орындалған жоқ, бірінші тапсырманы бастауға болады.'}
            </p>

            <div className="w-full mb-4 space-y-2 text-left">
              <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
                Сертификат талаптары
              </p>
              {certificateChecks.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-sm"
                  style={{ color: item.done ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                >
                  <CheckCircle2
                    size={16}
                    className={item.done ? 'text-green-500 shrink-0' : 'text-[var(--border)] shrink-0'}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleShareAchievement}
              disabled={!hasNormalProgress || isSharing}
              className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
            >
              {isSharing ? (
                'Сертификат дайындалуда...'
              ) : hasNormalProgress ? (
                <>
                  <Share2 size={16} />
                  Сертификатпен бөлісу
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Сертификат әлі ашық емес
                </>
              )}
            </button>
            {!hasNormalProgress && (
              <p className="text-xs mt-2 text-[var(--muted-foreground)]">{progressRequirementText}</p>
            )}
            {shareMessage && (
              <p className="text-xs mt-3 text-[var(--muted-foreground)]">{shareMessage}</p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
