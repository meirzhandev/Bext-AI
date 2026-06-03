import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BextOrb } from './components/BextOrb';
import { ChatInterface, type Message, type AttachedFile } from './components/ChatInterface';
import { TestPanel, type TestQuestion } from './components/TestPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { FlashcardsPanel, type Flashcard } from './components/FlashcardsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SetupGuide } from './components/SetupGuide';
import { CreateCardsModal, CreateTestModal } from './components/CreateModal';
import { FormulaReference } from './components/FormulaReference';
import { Dashboard, type UserStats, defaultStats } from './components/Dashboard';
import { SchedulePanel, type ScheduleEvent } from './components/SchedulePanel';
import { AVAILABLE_MODELS, AVAILABLE_PROVIDERS, chatCompletion, getDefaultModelForProvider, type ChatMessage, type ContentPart } from '../lib/openrouter';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Calculator, Layers, Target, ChevronRight, Menu } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────

interface HistoryItem {
  id: string;
  title: string;
  timestamp: Date | string | number;
  messageCount?: number;
  lastUpdated?: Date | string | number;
}

// Book type and library state removed

// ─── Helper Functions ─────────────────────────────────────────────────────

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    
    // If it's an object (but not an array), merge it with defaultValue to ensure all required fields exist
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue)) {
      return { ...defaultValue, ...parsed, subjects: { ...(defaultValue as any).subjects, ...parsed.subjects } } as T;
    }
    
    return parsed;
  } catch {
    return defaultValue;
  }
};

const saveToLocalStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

const loadChatMessages = (chatId: string) => {
  const messages = loadFromLocalStorage<Message[]>(`bext_chat_${chatId}`, []);
  return messages.map((message) => ({
    ...message,
    timestamp: new Date(message.timestamp),
  }));
};

// ─── App ──────────────────────────────────────────────────────────────────

type ThemeMode = 'light' | 'dark';

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('bext_theme_mode') as ThemeMode | null;
  if (stored === 'light' || stored === 'dark') return stored;
  // migrate legacy bext_theme (light/dark only)
  const legacy = localStorage.getItem('bext_theme');
  if (legacy === 'dark' || legacy === 'light') {
    const mode = legacy as ThemeMode;
    localStorage.setItem('bext_theme_mode', mode);
    return mode;
  }
  // If user previously used "system", resolve it once based on current OS theme.
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return prefersDark ? 'dark' : 'light';
};

const resolveIsDark = (mode: ThemeMode): boolean => {
  if (typeof window === 'undefined') return false;
  return mode === 'dark';
};

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialThemeMode());
  const [isDark, setIsDark] = useState(() => resolveIsDark(getInitialThemeMode()));
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [teacherMode, setTeacherMode] = useState(() => localStorage.getItem('bext_teacher_mode') === 'true');

  // API / Model
  const [selectedProvider, setSelectedProvider] = useState<'openrouter' | 'buildnvidia'>(() => {
    const saved = localStorage.getItem('bext_provider');
    return saved === 'buildnvidia' ? 'buildnvidia' : 'openrouter';
  });
  const [openrouterApiKey, setOpenrouterApiKey] = useState(() => localStorage.getItem('openrouter_api_key') || '');
  const [buildNvidiaApiKey, setBuildNvidiaApiKey] = useState(() => localStorage.getItem('buildnvidia_api_key') || '');
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('bext_model');
    return saved || getDefaultModelForProvider(selectedProvider);
  });

  const apiKey = selectedProvider === 'buildnvidia' ? buildNvidiaApiKey : openrouterApiKey;

  // Chat
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  // Data
  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => loadFromLocalStorage('bext_flashcards', []));
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>(() => loadFromLocalStorage('bext_tests', []));
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => loadFromLocalStorage('bext_history', []));
  const [userStats, setUserStats] = useState<UserStats>(() => loadFromLocalStorage('bext_stats', defaultStats));
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>(() => loadFromLocalStorage('bext_schedule', []));

  // Modals
  const [showCreateCards, setShowCreateCards] = useState(false);
  const [showCreateTest, setShowCreateTest] = useState(false);

  // Theme effect
  useEffect(() => {
    const dark = resolveIsDark(themeMode);
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, [themeMode]);

  // Batched persistence effect — combines all localStorage saves
  useEffect(() => {
    saveToLocalStorage('bext_theme_mode', themeMode);
    saveToLocalStorage('bext_flashcards', flashcards);
    saveToLocalStorage('bext_tests', testQuestions);
    saveToLocalStorage('bext_history', historyItems);
    saveToLocalStorage('bext_stats', userStats);
    saveToLocalStorage('bext_schedule', scheduleEvents);
    saveToLocalStorage('bext_teacher_mode', teacherMode);
    // API keys are saved directly in their handlers, not via JSON.stringify
    saveToLocalStorage('bext_provider', selectedProvider);
    saveToLocalStorage('bext_model', selectedModel);

    // Save current chat messages
    if (currentChatId && messages.length > 0) {
      saveToLocalStorage(`bext_chat_${currentChatId}`, messages);
    }

    // Save current chat ID as last active
    if (currentChatId) {
      localStorage.setItem('bext_last_chat_id', currentChatId);
    }
  }, [themeMode, flashcards, testQuestions, historyItems, userStats, scheduleEvents, teacherMode, messages, currentChatId]);

  // Load last chat session on app start
  useEffect(() => {
    const lastChatId = localStorage.getItem('bext_last_chat_id');
    if (lastChatId) {
      const savedMessages = loadChatMessages(lastChatId);
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setCurrentChatId(lastChatId);
      }
    }
  }, []);

  // Model persistence
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('bext_model', model);
  };

  const handleProviderChange = (provider: 'openrouter' | 'buildnvidia') => {
    setSelectedProvider(provider);
    localStorage.setItem('bext_provider', provider);
    const matchingModel = AVAILABLE_MODELS.find((model) => model.id === selectedModel && model.provider === provider);
    if (!matchingModel) {
      const defaultModel = getDefaultModelForProvider(provider);
      setSelectedModel(defaultModel);
      localStorage.setItem('bext_model', defaultModel);
    }
  };

  const handleOpenrouterApiKeyChange = (key: string) => {
    setOpenrouterApiKey(key);
    localStorage.setItem('openrouter_api_key', key);
  };

  const handleBuildNvidiaApiKeyChange = (key: string) => {
    setBuildNvidiaApiKey(key);
    localStorage.setItem('buildnvidia_api_key', key);
  };

  // ─── Chat ───────────────────────────────────────────────────────────────

  const buildOpenRouterMessages = (msgs: Message[], newContent: string, attachments?: AttachedFile[]): ChatMessage[] => {
    const systemPrompt = teacherMode
      ? `Сен Bext AI — Қазақстандағы ҰБТ/ЕНТ емтиханына дайындыққа арналған қазақ тіліндегі AI оқу ассистентісің.

Сен қазіргі уақытта ҰСТАЗ РЕЖИМІНДЕСІҢ.

Ұстаз режимінің ережелері:
- Оқушыға ешқашан дайын жауап берме
- Оның орнына бағыттаушы сұрақтар қой: "Бұл формула не үшін қолданылады?", "Келесі қадам не болуы керек?"
- Оқушы қателессе — қателігін атамай, дұрыс бағытқа бағытта
- Математика есептерінде: "Бастапқы деректер не?", "Қандай формула қолданамыз?" деп сұра
- Информатика тапсырмаларында: "Алгоритмнің бірінші қадамы не?" деп жеттелте

Пәндер: Математика, Информатика (ҰБТ/ЕНТ бағдарламасы бойынша)
Тіл: тек қазақша жауап бер`
      : `Сен Bext AI — Қазақстандағы ҰБТ/ЕНТ емтиханына дайындыққа арналған қазақ тіліндегі AI оқу ассистентісің.

Негізгі пәндер: Математика және Информатика (ҰБТ/ЕНТ бағдарламасы бойынша)

Жауап беру ережелері:
1. Барлық жауаптарды тек қазақ тілінде бер.
2. Есеп шығарғанда (әсіресе математика) өте толық түсіндір. МІНДЕТТІ ТҮРДЕ мына форматты қатаң сақта:
   **Берілгені:** (нені білеміз?)
   **Табу керек:** (нені сұрап тұр?)
   **Қолданылатын формула:** (қандай ереже/формула қолданамыз?)
   **Қадам 1:** (бірінші амал және түсіндірме)
   **Қадам 2:** (екінші амал және түсіндірме)
   ... (осылай әр амалды міндетті түрде дәл "Қадам N:" деп жаз)
   **Жауап:** (нақты қорытынды)
   ЕСКЕРТУ: "Қадам 1:", "Қадам 2:" деген нақты сөздерді жазу өте маңызды, бұл жүйенің дұрыс жұмыс істеуі үшін қажет!
3. ҰБТ/ЕНТ тест сұрақтары болса — A, B, C, D нұсқаларымен жауап бер және әрқашан дұрыс жауаптың НЕЛІКТЕН дұрыс екенін дәлелде.
4. Информатика алгоритмдерін Python тілінде жазғанда, кодтың әр қатарына комментарий қалдыр және қалай жұмыс істейтінін егжей-тегжейлі түсіндір.
5. Формулаларды LaTeX форматында жаз: $формула$
6. Егер оқушы қате ойласа, неліктен қате екенін жұмсақ түрде, бірақ нақты түсіндір.
7. Теорема, анықтама сұралса — ресми, толық анықтамасын беріп, өмірден мысал келтір.

ҰБТ/ЕНТ туралы: Қазақстанда 11-сынып бітірушілері тапсыратын ұлттық бірыңғай тестілеу. Математика мен Информатика пәндерінен 4 нұсқалы (A, B, C, D) сұрақтар болады.`;

    const history: ChatMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Add recent context (last 6 messages)
    msgs.slice(-6).forEach((m) => {
      history.push({
        role: m.role,
        content: m.content,
      });
    });

    // Build new user message
    if (attachments && attachments.length > 0) {
      const parts: ContentPart[] = [];

      if (newContent) parts.push({ type: 'text', text: newContent });

      attachments.forEach((att) => {
        if (att.type === 'image') {
          const modelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel);
          if (modelInfo?.supportsVision) {
            parts.push({ type: 'image_url', image_url: { url: att.content } });
          } else {
            parts.push({ type: 'text', text: `[Сурет: ${att.name} — бұл модель суреттерді қолдамайды]` });
          }
        } else {
          // For code files, use proper code block formatting
          const ext = att.name.split('.').pop()?.toLowerCase() || '';
          const codeExts = ['py', 'js', 'ts', 'tsx', 'jsx', 'html', 'css', 'scss', 'json', 'xml', 'sql', 'sh', 'c', 'cpp', 'java', 'go', 'rs', 'php', 'rb'];
          const isCode = codeExts.includes(ext);
          
          // Limit content size to prevent API errors
          let fileContent = att.content;
          if (fileContent.length > 6000) {
            fileContent = fileContent.substring(0, 6000) + `\n\n[... файл мазмұны қысқартылды ...]`;
          }
          
          if (isCode) {
            parts.push({ type: 'text', text: `\n\nФайл мазмұны (${att.name}):\n\`\`\`${ext}\n${fileContent}\n\`\`\`` });
          } else {
            parts.push({ type: 'text', text: `\n\nФайл мазмұны (${att.name}):\n${fileContent}` });
          }
        }
      });

      history.push({ role: 'user', content: parts });
    } else {
      history.push({ role: 'user', content: newContent });
    }

    return history;
  };

  const handleSendMessage = async (content: string, attachments?: AttachedFile[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      attachments,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      let responseContent: string;

      if (apiKey) {
        const apiMessages = buildOpenRouterMessages(nextMessages, content, attachments);
        try {
          const normalizedModel = selectedModel.trim();
          const modelToUse = normalizedModel || (selectedProvider === 'openrouter' ? 'openrouter/free' : '');
          if (!modelToUse) {
            throw new Error('Build NVIDIA үшін модель ID енгізілмеген. Баптауларға өтіп, модельді қолмен қосыңыз.');
          }
          responseContent = await chatCompletion(apiMessages, apiKey, modelToUse, selectedProvider);
        } catch (apiError: any) {
          // Handle API-specific errors
          const errorMsg = apiError.message || '';
          if (errorMsg.includes('content_policy')) {
            responseContent = `⚠️ Қате: Сіздің сұрағыңыз API саясатына сәйкес келмейді. Өзгеше формада сұраңыз.`;
          } else if (errorMsg.includes('context_length') || errorMsg.includes('token')) {
            responseContent = `⚠️ Қате: Сообщение или файл слишком большие. Файлдар өлшемін азайтыңыз немесе қысқа сұрақ қойыңыз.`;
          } else if (errorMsg.includes('overloaded')) {
            responseContent = `⚠️ Қате: Сервер ауырыласа жатыр. Бірнеше секундтан кейін қайтап көріңіз.`;
          } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
            responseContent = `⚠️ Қате: ${selectedProvider === 'buildnvidia' ? 'Build NVIDIA' : 'OpenRouter'} API кілті жарамсыз немесе ескісі. Баптауларда API кілтін тексеріңіз.`;
          } else {
            responseContent = `⚠️ Қате: ${errorMsg || 'Белгісіз қателік орын алды. Қайта көріңіз.'}`;
          }
        }
      } else {
        // Mock response when no API key
        await new Promise((r) => setTimeout(r, 1200));
        responseContent = `Сіздің сұрағыңыз алынды: "${content}"\n\nТолық жауап алу үшін Баптауларда OpenRouter API кілтін орнатыңыз. Тегін API кілт алу үшін openrouter.ai сайтына кіріңіз.`;
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Add to history if it's a new chat
      if (messages.length === 0) {
        const newChatId = Date.now().toString();
        setCurrentChatId(newChatId);
        const historyItem: HistoryItem = {
          id: newChatId,
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          timestamp: new Date(),
          messageCount: 2, // user + assistant
          lastUpdated: new Date(),
        };
        setHistoryItems((prev) => [historyItem, ...prev]);
      } else {
        // Update existing chat with new message count and timestamp
        setHistoryItems((prev) => 
          prev.map((item) =>
            item.id === currentChatId
              ? {
                  ...item,
                  messageCount: nextMessages.length + 1, // user + assistant
                  lastUpdated: new Date(),
                }
              : item
          )
        );
      }
    } catch (e: any) {
      const errMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Қате: ${e.message || 'Қателік орын алды. Қайта көріңіз.'}`,
        timestamp: new Date(),
        error: true,
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setActiveSection('home');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard stats={userStats} />;

      case 'history':
        return (
          <HistoryPanel
            items={historyItems}
            onSelectItem={(id) => {
              const savedMessages = loadChatMessages(id);
              setMessages(savedMessages);
              setCurrentChatId(id);
              setActiveSection('home');
            }}
            onDeleteItem={(id) => {
              setHistoryItems((prev) => prev.filter((i) => i.id !== id));
              localStorage.removeItem(`bext_chat_${id}`);
              if (currentChatId === id) {
                setMessages([]);
                setCurrentChatId(null);
              }
            }}
            onRenameItem={(id, newTitle) => {
              setHistoryItems((prev) => prev.map((h) => (h.id === id ? { ...h, title: newTitle, lastUpdated: new Date() } : h)));
            }}
          />
        );


      case 'cards':
        return (
          <FlashcardsPanel
            cards={flashcards}
            onCreateAI={() => setShowCreateCards(true)}
            onCreateManual={() => setShowCreateCards(true)}
            onDelete={(id) => setFlashcards((prev) => prev.filter((c) => c.id !== id))}
            onEdit={(updated) => setFlashcards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))}
            onImport={(imported) => setFlashcards((prev) => [...prev, ...imported])}
          />
        );

      case 'test':
        return (
          <TestPanel
            questions={testQuestions}
            onCreateAI={() => setShowCreateTest(true)}
            onCreateManual={() => setShowCreateTest(true)}
            onDelete={(id) => setTestQuestions((prev) => prev.filter((q) => q.id !== id))}
            onEdit={(updated) => setTestQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)))}
            onImport={(imported) => setTestQuestions((prev) => [...prev, ...imported])}
          />
        );

      case 'settings':
        return (
          <SettingsPanel
            selectedProvider={selectedProvider}
            onProviderChange={handleProviderChange}
            openrouterApiKey={openrouterApiKey}
            buildNvidiaApiKey={buildNvidiaApiKey}
            onOpenrouterApiKeyChange={handleOpenrouterApiKeyChange}
            onBuildNvidiaApiKeyChange={handleBuildNvidiaApiKeyChange}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            teacherMode={teacherMode}
            onToggleTeacher={() => setTeacherMode(!teacherMode)}
            historyItems={historyItems}
            onHistoryImport={(newItems) => setHistoryItems(newItems)}
          />
        );

      case 'setup':
        return <SetupGuide />;

      case 'formulas':
        return <FormulaReference />;

      case 'schedule':
        return (
          <SchedulePanel
            events={scheduleEvents}
            onAddEvent={(event) => {
              const newEvent: ScheduleEvent = { ...event, id: Date.now().toString() };
              setScheduleEvents(prev => [...prev, newEvent]);
            }}
            onUpdateEvent={(updated) => {
              setScheduleEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
            }}
            onDeleteEvent={(id) => {
              setScheduleEvents(prev => prev.filter(e => e.id !== id));
            }}
            onAutoPlan={(topics, days) => {
              const newEvents: ScheduleEvent[] = topics.map((topic, index) => {
                const eventDate = new Date();
                eventDate.setDate(eventDate.getDate() + (index % days));
                return {
                  id: Date.now().toString() + index,
                  title: topic,
                  date: eventDate.toISOString(),
                  type: 'study',
                  isCompleted: false,
                  priority: 'high'
                };
              });
              setScheduleEvents(prev => [...prev, ...newEvents]);
            }}
            apiKey={apiKey}
          />
        );

      // Home / Chat
      default:
        return (
          <div className="h-full flex flex-col">
            {messages.length === 0 ? (
              <>
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                  <BextOrb isThinking={isThinking} />

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mt-2 flex flex-col items-center"
                  >
                    <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                      Bext AI — ҰБТ дайындыққа арналған оқу көмекшісі
                    </h1>
                    <p className="mb-8 max-w-md mx-auto" style={{ color: 'var(--muted-foreground)' }}>
                      ҰБТ-ға дайындалу үшін сұрақтар қойыңыз, файл немесе сурет тіркеңіз және нақты қазақша жауап алыңыз
                    </p>

                    {/* Quick action chips */}
                    <div className="flex flex-wrap gap-2 justify-center mb-2">
                      {[
                        { icon: <Brain size={13} />, text: 'Информатика теорияларын түсіндір' },
                        { icon: <Calculator size={13} />, text: 'Математика формулаларын көрсетіп шық' },
                        { icon: <Layers size={13} />, text: 'Карточкалар жасауға көмектес' },
                        { icon: <Target size={13} />, text: 'Математика есебін шеш' },
                      ].map((chip) => (
                        <motion.button
                          key={chip.text}
                          onClick={() => handleSendMessage(chip.text)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm glow-card-hover"
                          style={{
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            color: 'var(--foreground)',
                          }}
                          whileHover={{ scale: 1.02, background: 'rgba(124,58,237,0.06)' }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span style={{ color: 'var(--primary)' }}>{chip.icon}</span>
                          {chip.text}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Input at bottom */}
                <ChatInterface
                  messages={[]}
                  onSendMessage={handleSendMessage}
                  isThinking={isThinking}
                  apiKey={apiKey}
                  inputOnly
                  teacherMode={teacherMode}
                  onToggleTeacher={() => setTeacherMode(!teacherMode)}
                />
              </>
            ) : (
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isThinking={isThinking}
                apiKey={apiKey}
                teacherMode={teacherMode}
                onToggleTeacher={() => setTeacherMode(!teacherMode)}
              />
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--background)' }}>
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.08) 0%, transparent 55%)'
            : 'radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.05) 0%, transparent 55%)',
        }}
      />

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-blob absolute rounded-full"
          style={{
            width: 480,
            height: 480,
            top: '-10%',
            left: '-8%',
            background: isDark
              ? 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="ambient-blob-2 absolute rounded-full"
          style={{
            width: 360,
            height: 360,
            bottom: '5%',
            right: '5%',
            background: isDark
              ? 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="ambient-blob absolute rounded-full"
          style={{
            width: 280,
            height: 280,
            top: '45%',
            left: '55%',
            background: isDark
              ? 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)',
            filter: 'blur(35px)',
            animationDelay: '-4s',
          }}
        />
      </div>

      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        historyItems={historyItems}
        onNewChat={handleNewChat}
        apiKey={apiKey}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Header */}
      <Header
        isDark={isDark}
        onChangeThemeMode={setThemeMode}
        activeSection={activeSection}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Sidebar edge toggle */}
      <motion.button
        onClick={() => setSidebarCollapsed((prev) => !prev)}
        className="hidden md:flex fixed top-1/2 -translate-y-1/2 z-40 items-center justify-center"
        animate={{ left: sidebarCollapsed ? 64 : 280 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          transform: 'translateX(-50%) translateY(-50%)',
          minWidth: '30px',
          height: '30px',
          borderRadius: '50%',
          background: isDark ? 'rgba(124, 58, 237, 0.88)' : 'rgba(255, 255, 255, 0.92)',
          color: isDark ? 'white' : 'var(--foreground)',
          border: isDark ? '1px solid rgba(124, 58, 237, 0.4)' : '1px solid rgba(148, 163, 184, 0.25)',
          boxShadow: isDark ? '0 10px 22px rgba(124, 58, 237, 0.2)' : '0 10px 22px rgba(15, 23, 42, 0.12)',
          cursor: 'pointer',
          backdropFilter: 'blur(14px)',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={sidebarCollapsed ? 'Бүйірлік тақтаны ашу' : 'Бүйірлік тақтаны ықшамдау'}
      >
        <motion.div animate={{ rotate: sidebarCollapsed ? 0 : 180 }} transition={{ duration: 0.25, ease: 'easeInOut' }}>
          <ChevronRight size={14} strokeWidth={2.2} />
        </motion.div>
      </motion.button>
      <motion.button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-3 top-1/2 -translate-y-1/2 z-40 md:hidden flex items-center justify-center"
        style={{
          height: '38px',
          width: '38px',
          borderRadius: '12px',
          background: 'rgba(124, 58, 237, 0.96)',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 22px rgba(124, 58, 237, 0.22)',
          cursor: 'pointer',
          display: sidebarOpen ? 'none' : 'flex',
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Бүйірлік тақтаны ашу"
      >
        <Menu size={18} strokeWidth={2.2} />
      </motion.button>

      {/* Main Content */}
      <motion.main
        className="fixed top-[60px] bottom-0 right-0 overflow-y-auto overflow-x-hidden left-0"
        animate={{ marginLeft: sidebarCollapsed ? 64 : 280 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {/* Create Modals */}
      <CreateCardsModal
        isOpen={showCreateCards}
        onClose={() => setShowCreateCards(false)}
        onAdd={(cards) => {
          const newCards = cards.map((c) => ({ ...c, id: Date.now().toString() + Math.random() }));
          setFlashcards((prev) => [...prev, ...newCards]);
        }}
        apiKey={apiKey}
        model={selectedModel}
      />

      <CreateTestModal
        isOpen={showCreateTest}
        onClose={() => setShowCreateTest(false)}
        onAdd={(questions) => {
          const newQs = questions.map((q) => ({ ...q, id: Date.now().toString() + Math.random() }));
          setTestQuestions((prev) => [...prev, ...newQs]);
        }}
        apiKey={apiKey}
        model={selectedModel}
      />
    </div>
  );
}