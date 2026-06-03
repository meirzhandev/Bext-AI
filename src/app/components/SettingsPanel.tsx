import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, ExternalLink, Cpu, AlertCircle, GraduationCap, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AVAILABLE_PROVIDERS, getModelsForProvider } from '../../lib/openrouter';
import { exportChatHistory, downloadChatHistory, importChatHistory, getAllChatMessages, restoreChatHistory } from '../../lib/chatHistory';

// Logo component with PNG + SVG fallback support
const LogoWithFallback = ({ 
  pngSrc, 
  svgSrc, 
  alt 
}: { 
  pngSrc: string; 
  svgSrc?: string; 
  alt: string 
}) => {
  const [useSvg, setUseSvg] = useState(false);

  return (
    <div className="w-16 h-16 rounded-[28px] grid place-items-center" style={{ background: 'rgba(255,255,255,0.1)', padding: '4px' }}>
      {!useSvg && pngSrc ? (
        <img 
          src={pngSrc} 
          alt={alt} 
          className="w-full h-full object-contain" 
          onError={() => setUseSvg(true)}
        />
      ) : svgSrc ? (
        <img 
          src={svgSrc} 
          alt={alt} 
          className="w-full h-full object-contain" 
        />
      ) : (
        <div className="text-xs text-[var(--muted-foreground)]">{alt}</div>
      )}
    </div>
  );
};

const OpenRouterLogo = () => (
  <LogoWithFallback 
    pngSrc="/logos/openrouter.png"
    svgSrc="/logos/openrouter.svg"
    alt="OpenRouter" 
  />
);

const BuildNvidiaLogo = () => (
  <LogoWithFallback 
    pngSrc="/logos/nvidia.png"
    svgSrc="/logos/nvidia.svg"
    alt="NVIDIA" 
  />
);

interface SettingsPanelProps {
  selectedProvider: 'openrouter' | 'buildnvidia';
  onProviderChange: (provider: 'openrouter' | 'buildnvidia') => void;
  openrouterApiKey: string;
  buildNvidiaApiKey: string;
  onOpenrouterApiKeyChange: (key: string) => void;
  onBuildNvidiaApiKeyChange: (key: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  teacherMode: boolean;
  onToggleTeacher: () => void;
  historyItems?: any[];
  onHistoryImport?: (items: any[]) => void;
}

export function SettingsPanel({
  selectedProvider,
  onProviderChange,
  openrouterApiKey,
  buildNvidiaApiKey,
  onOpenrouterApiKeyChange,
  onBuildNvidiaApiKeyChange,
  selectedModel,
  onModelChange,
  teacherMode,
  onToggleTeacher,
  historyItems = [],
  onHistoryImport,
}: SettingsPanelProps) {
  const [openrouterInputKey, setOpenrouterInputKey] = useState(openrouterApiKey);
  const [buildNvidiaInputKey, setBuildNvidiaInputKey] = useState(buildNvidiaApiKey);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [showBuildNvidiaKey, setShowBuildNvidiaKey] = useState(false);
  const [openrouterSaved, setOpenrouterSaved] = useState(false);
  const [buildNvidiaSaved, setBuildNvidiaSaved] = useState(false);
  const [openrouterTesting, setOpenrouterTesting] = useState(false);
  const [buildNvidiaTesting, setBuildNvidiaTesting] = useState(false);
  const [customModelInput, setCustomModelInput] = useState(selectedModel);

  useEffect(() => {
    setOpenrouterInputKey(openrouterApiKey);
  }, [openrouterApiKey]);

  useEffect(() => {
    setBuildNvidiaInputKey(buildNvidiaApiKey);
  }, [buildNvidiaApiKey]);

  useEffect(() => {
    setCustomModelInput(selectedModel);
  }, [selectedModel]);

  const providerModels = getModelsForProvider(selectedProvider);
  const providerUi = {
    openrouter: {
      name: 'OpenRouter',
      accent: '#7c3aed',
      accentSoft: 'rgba(124, 58, 237, 0.12)',
      logo: <OpenRouterLogo />,
      primaryBg: 'linear-gradient(180deg, rgba(124,58,237,0.18), rgba(124,58,237,0.04))',
      border: 'rgba(124,58,237,0.16)',
      buttonBg: 'rgba(124,58,237,0.08)',
      link: 'https://openrouter.ai/keys',
      description: 'OpenRouter провайдері үшін жеке және қауіпсіз API кілтін қойыңыз.',
    },
    buildnvidia: {
      name: 'Build NVIDIA',
      accent: '#76b900',
      accentSoft: 'rgba(118, 185, 0, 0.12)',
      logo: <BuildNvidiaLogo />,
      primaryBg: 'linear-gradient(180deg, rgba(118,185,0,0.18), rgba(118,185,0,0.04))',
      border: 'rgba(118,185,0,0.16)',
      buttonBg: 'rgba(118,185,0,0.08)',
      link: 'https://build.nvidia.com',
      description: 'Build NVIDIA провайдері үшін өзіңіздің кілтіңізді сақтаңыз.',
    },
  } as const;

  const [openrouterTestResult, setOpenrouterTestResult] = useState<'success' | 'error' | null>(null);
  const [buildNvidiaTestResult, setBuildNvidiaTestResult] = useState<'success' | 'error' | null>(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSaveOpenrouter = () => {
    onOpenrouterApiKeyChange(openrouterInputKey.trim());
    setOpenrouterSaved(true);
    setOpenrouterTestResult(null);
    setTimeout(() => setOpenrouterSaved(false), 2500);
  };

  const handleSaveBuildNvidia = () => {
    onBuildNvidiaApiKeyChange(buildNvidiaInputKey.trim());
    setBuildNvidiaSaved(true);
    setBuildNvidiaTestResult(null);
    setTimeout(() => setBuildNvidiaSaved(false), 2500);
  };

  const handleTestProvider = async (provider: 'openrouter' | 'buildnvidia') => {
    const inputKey = provider === 'buildnvidia' ? buildNvidiaInputKey.trim() : openrouterInputKey.trim();
    const modelForTest = selectedModel.trim() || (provider === 'openrouter' ? 'openrouter/free' : '');
    if (!inputKey) return;
    if (!modelForTest) {
      if (provider === 'buildnvidia') {
        setBuildNvidiaTestResult('error');
      } else {
        setOpenrouterTestResult('error');
      }
      return;
    }

    if (provider === 'buildnvidia') {
      setBuildNvidiaTesting(true);
      setBuildNvidiaTestResult(null);
    } else {
      setOpenrouterTesting(true);
      setOpenrouterTestResult(null);
    }

    try {
      const url = provider === 'buildnvidia'
        ? 'https://api.build.nvidia.com/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${inputKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Bext AI',
        },
        body: JSON.stringify({
          model: modelForTest,
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });

      if (provider === 'buildnvidia') {
        setBuildNvidiaTestResult(res.ok ? 'success' : 'error');
      } else {
        setOpenrouterTestResult(res.ok ? 'success' : 'error');
      }
    } catch {
      if (provider === 'buildnvidia') {
        setBuildNvidiaTestResult('error');
      } else {
        setOpenrouterTestResult('error');
      }
    } finally {
      if (provider === 'buildnvidia') {
        setBuildNvidiaTesting(false);
      } else {
        setOpenrouterTesting(false);
      }
    }
  };

  const handleExportHistory = () => {
    const chatMessages = getAllChatMessages(historyItems);
    const exportData = exportChatHistory(historyItems, chatMessages);
    downloadChatHistory(exportData);
  };

  const handleImportHistory = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onHistoryImport) return;

    setImporting(true);
    setImportMessage(null);

    try {
      const imported = await importChatHistory(file);
      const { newHistoryItems, message } = restoreChatHistory(imported, historyItems);
      onHistoryImport(newHistoryItems);
      setImportMessage({ text: message, type: 'success' });
    } catch (error: any) {
      setImportMessage({
        text: error.message || 'Импорт қатесі',
        type: 'error',
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto px-10 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Баптаулар
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            OpenRouter немесе Build NVIDIA провайдерін таңдап, оның API кілтін және моделін баптаңыз
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124, 58, 237, 0.12)' }}
            >
              <Key size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
                API провайдері мен кілті
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Егер сізде ИИ жұмыс істемей қателік болып жатса оның жанындағы " \ осындай белгілерді алып тастаңыз. Бұл кілт тек сіздің құрылғыңызда сақталады және ешқайда жіберілмейді.
              </p>
            </div>
          </div>

          <div className="grid gap-3 mb-6 sm:grid-cols-2">
            {AVAILABLE_PROVIDERS.map((provider) => {
              const isActive = selectedProvider === provider.id;
              const providerStyle = providerUi[provider.id];

              return (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => onProviderChange(provider.id)}
                  className="group relative flex h-16 items-center gap-4 rounded-[28px] px-5 text-sm font-semibold transition-all"
                  style={{
                    background: isActive ? providerStyle.primaryBg : 'var(--input-background)',
                    color: isActive ? providerStyle.accent : 'var(--foreground)',
                    border: `1px solid ${isActive ? providerStyle.border : 'var(--border)'}`,
                    boxShadow: isActive ? `0 18px 35px ${providerStyle.accent}20` : 'none',
                  }}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-white/10">
                    {providerStyle.logo}
                  </div>
                  <div className="text-left leading-tight">
                    <div>{provider.name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {provider.id === 'openrouter' ? 'OpenRouter стиль' : 'NVIDIA стиль'}
                    </div>
                  </div>
                  {isActive && (
                    <span
                      className="ml-auto inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold"
                      style={{
                        background: providerStyle.accentSoft,
                        color: providerStyle.accent,
                      }}
                    >
                      Таңдалған
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] p-6 min-h-[420px]"
              style={{
                background: providerUi.openrouter.primaryBg,
                border: `1px solid ${selectedProvider === 'openrouter' ? providerUi.openrouter.border : 'var(--border)'}`,
                boxShadow: selectedProvider === 'openrouter' ? '0 20px 60px rgba(124,58,237,0.16)' : '0 10px 30px rgba(0,0,0,0.08)',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  {providerUi.openrouter.logo}
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                      OpenRouter API
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {providerUi.openrouter.description}
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: providerUi.openrouter.accentSoft,
                    color: providerUi.openrouter.accent,
                  }}
                >
                  ҰСЫНЫЛҒАН
                  Әлемдік модельдер
                </span>
              </div>

              <div className="relative mb-4">
                <input
                  type={showOpenrouterKey ? 'text' : 'password'}
                  value={openrouterInputKey}
                  onChange={(e) => {
                    setOpenrouterInputKey(e.target.value);
                    setOpenrouterTestResult(null);
                  }}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxx"
                  className="w-full h-14 rounded-[26px] border px-4 pr-14 font-mono text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderColor: 'rgba(124,58,237,0.18)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm transition-opacity"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showOpenrouterKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <motion.button
                  onClick={handleSaveOpenrouter}
                  className="flex h-12 items-center justify-center rounded-2xl text-sm font-semibold"
                  style={{
                    background: providerUi.openrouter.accent,
                    color: '#ffffff',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {openrouterSaved ? 'Сақталды!' : 'Сақтау'}
                </motion.button>
                <motion.button
                  onClick={() => handleTestProvider('openrouter')}
                  disabled={!openrouterInputKey.trim() || openrouterTesting}
                  className="flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold disabled:opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderColor: providerUi.openrouter.border,
                    color: providerUi.openrouter.accent,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {openrouterTesting ? 'Тексеру...' : 'Тексеру'}
                </motion.button>
              </div>

              {openrouterApiKey && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium" style={{ color: '#10B981' }}>
                  <Check size={14} />
                  OpenRouter API кілті орнатылған
                </div>
              )}

              <a
                href={providerUi.openrouter.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: providerUi.openrouter.accent }}
              >
                API алу
                <ExternalLink size={13} />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] p-6 min-h-[420px]"
              style={{
                background: providerUi.buildnvidia.primaryBg,
                border: `1px solid ${selectedProvider === 'buildnvidia' ? providerUi.buildnvidia.border : 'var(--border)'}`,
                boxShadow: selectedProvider === 'buildnvidia' ? '0 20px 60px rgba(118,185,0,0.16)' : '0 10px 30px rgba(0,0,0,0.08)',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  {providerUi.buildnvidia.logo}
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
                      Build NVIDIA API
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      {providerUi.buildnvidia.description}
                    </p>
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: providerUi.buildnvidia.accentSoft,
                    color: providerUi.buildnvidia.accent,
                  }}
                >
                  Мықты бірақ танымал емес модельдер
                </span>
              </div>

              <div className="relative mb-4">
                <input
                  type={showBuildNvidiaKey ? 'text' : 'password'}
                  value={buildNvidiaInputKey}
                  onChange={(e) => {
                    setBuildNvidiaInputKey(e.target.value);
                    setBuildNvidiaTestResult(null);
                  }}
                  placeholder="bldnvd-xxxxxxxxxxxxxxxx"
                  className="w-full h-14 rounded-[26px] border px-4 pr-14 font-mono text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    borderColor: 'rgba(118,185,0,0.18)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  onClick={() => setShowBuildNvidiaKey(!showBuildNvidiaKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm transition-opacity"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showBuildNvidiaKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <motion.button
                  onClick={handleSaveBuildNvidia}
                  className="flex h-12 items-center justify-center rounded-2xl text-sm font-semibold"
                  style={{
                    background: providerUi.buildnvidia.accent,
                    color: '#ffffff',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {buildNvidiaSaved ? 'Сақталды!' : 'Сақтау'}
                </motion.button>
                <motion.button
                  onClick={() => handleTestProvider('buildnvidia')}
                  disabled={!buildNvidiaInputKey.trim() || buildNvidiaTesting}
                  className="flex h-12 items-center justify-center rounded-2xl border text-sm font-semibold disabled:opacity-40"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    borderColor: providerUi.buildnvidia.border,
                    color: providerUi.buildnvidia.accent,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {buildNvidiaTesting ? 'Тексеру...' : 'Тексеру'}
                </motion.button>
              </div>

              {buildNvidiaApiKey && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium" style={{ color: '#10B981' }}>
                  <Check size={14} />
                  Build NVIDIA API кілті орнатылған
                </div>
              )}

              <a
                href={providerUi.buildnvidia.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
                style={{ color: providerUi.buildnvidia.accent }}
              >
                API алу
                <ExternalLink size={13} />
              </a>
            </motion.div>
          </div>
        </motion.div>

        {/* Model Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 mb-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(124, 58, 237, 0.12)' }}
            >
              <Cpu size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
                ИИ Моделі
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Чат үшін қолданылатын модельді таңдаңыз
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div
              className="rounded-xl border p-3"
              style={{ background: 'var(--input-background)', borderColor: 'var(--border)' }}
            >
              <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>
                Қолмен модель ID енгізу
              </p>
              <div className="flex gap-2">
                <input
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder={selectedProvider === 'buildnvidia' ? 'Мысалы: nvidia/...' : 'Мысалы: openai/gpt-4o-mini'}
                  className="w-full h-10 rounded-lg border px-3 text-sm outline-none"
                  style={{
                    background: 'var(--background)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  onClick={() => onModelChange(customModelInput.trim())}
                  className="h-10 px-3 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  Қосу
                </button>
              </div>
            </div>

            {providerModels.length === 0 && (
              <div className="text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#D97706' }}>
                Бұл провайдер үшін preset-модельдер өшірілді. Жоғарыдағы өріске өз модель ID-іңізді енгізіңіз.
              </div>
            )}

            {providerModels.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <motion.button
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: isSelected ? 'rgba(124, 58, 237, 0.08)' : 'var(--input-background)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: isSelected ? 'var(--primary)' : 'var(--muted)' }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-medium"
                            style={{ color: 'var(--foreground)' }}
                          >
                            {model.name}
                          </span>
                          {model.isFree && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(16,185,129,0.12)',
                                color: '#10B981',
                              }}
                            >
                              Тегін
                            </span>
                          )}
                          {model.supportsVision && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: 'rgba(124,58,237,0.1)',
                                color: 'var(--primary)',
                              }}
                            >
                              Суреттер
                            </span>
                          )}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          {model.description}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check size={16} style={{ color: 'var(--primary)' }} />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Teacher Mode Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-6 mb-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16, 185, 129, 0.12)' }}
              >
                <GraduationCap size={18} style={{ color: '#10B981' }} />
              </div>
              <div>
                <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
                  «Ұстаз» режимі
                </h3>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                  ИИ дайын жауап бермейді, бағыттаушы сұрақтар қояды
                </p>
              </div>
            </div>
            
            <button
              onClick={onToggleTeacher}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ background: teacherMode ? '#10B981' : 'var(--switch-background)' }}
            >
              <motion.div
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ x: teacherMode ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
        </motion.div>

        {/* Chat History Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-6 mb-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99, 102, 241, 0.12)' }}
            >
              <Download size={18} style={{ color: '#6366F1' }} />
            </div>
            <div>
              <h3 className="font-medium" style={{ color: 'var(--foreground)' }}>
                Тарихты сақтау және қалпына келтіру
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Барлық чаттарын экспорт қылып, басқа құрылғыда импорт қылыңыз
              </p>
            </div>
          </div>

          {importMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 px-4 py-3 rounded-xl flex items-center gap-2 text-sm"
              style={{
                background: importMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${importMessage.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: importMessage.type === 'success' ? '#10B981' : '#EF4444',
              }}
            >
              {importMessage.type === 'success' ? (
                <Check size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              <span>{importMessage.text}</span>
            </motion.div>
          )}

          <div className="flex gap-3">
            <motion.button
              onClick={handleExportHistory}
              disabled={historyItems.length === 0}
              className="flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2 text-sm disabled:opacity-40"
              style={{
                background: 'var(--input-background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download size={15} />
              Экспорт қылу ({historyItems.length})
            </motion.button>

            <motion.label
              className="flex-1 h-11 rounded-xl font-medium flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-40"
              style={{
                background: '#6366F1',
                color: 'white',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <Upload size={15} />
              {importing ? 'Импортталуда...' : 'Импорт қылу'}
              <input
                type="file"
                accept=".json"
                onChange={handleImportHistory}
                disabled={importing}
                style={{ display: 'none' }}
              />
            </motion.label>
          </div>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5"
          style={{
            background: 'rgba(124, 58, 237, 0.06)',
            border: '1px solid rgba(124, 58, 237, 0.15)',
          }}
        >
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            🔐 API кілтіңіз тек браузеріңізде сақталады және ешқайда жіберілмейді. OpenRouter немесе Build NVIDIA провайдерінен қажетті API кілтін алып, Bext AI-ды толық пайдалана аласыз.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
