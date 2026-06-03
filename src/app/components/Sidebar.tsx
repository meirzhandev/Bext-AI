import { useState } from 'react';
import {
  MessageSquare,
  Clock,
  Layers,
  ClipboardCheck,
  Settings,
  HelpCircle,
  Plus,
  ChevronRight,
  GraduationCap,
  Menu,
  X as XIcon,
  BarChart3,
  Sigma,
  CalendarDays,
  Target,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryItem {
  id: string;
  title: string;
  timestamp: Date | string | number;
}
  
interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  historyItems: HistoryItem[];
  onNewChat: () => void;
  apiKey: string;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
}

const mainNavItems = [
  { id: 'home', icon: MessageSquare, label: 'Чат' },
  { id: 'dashboard', icon: BarChart3, label: 'Менің жетістіктерім' },
  { id: 'schedule', icon: CalendarDays, label: 'Күнтізбе' },
  { id: 'formulas', icon: Sigma, label: 'Формулалар' },
  { id: 'cards', icon: Layers, label: 'Карточкалар' },
  { id: 'test', icon: ClipboardCheck, label: 'Тесттер' },
];

const bottomNavItems = [
  { id: 'history', icon: Clock, label: 'Тарих' },
  { id: 'setup', icon: HelpCircle, label: 'Нұсқаулық' },
  { id: 'settings', icon: Settings, label: 'Баптаулар' },
];

export function Sidebar({ activeSection, onSectionChange, historyItems, onNewChat, apiKey, isOpen, isCollapsed, onToggleCollapse, onClose }: SidebarProps) {
  const [showHistory, setShowHistory] = useState(true);

  const formatDate = (d: Date | string | number) => {
    const date = typeof d === 'number' ? new Date(d) : typeof d === 'string' ? new Date(d) : d;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Белгісіз';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 24) return 'Бүгін';
    if (hours < 48) return 'Кеше';
    return date.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'short' });
  };

  const mobileTranslate = isOpen ? 'translate-x-0' : '-translate-x-full';
  const sidebarWidthClass = isCollapsed ? 'md:w-[64px]' : 'md:w-[280px]';
  const sectionPadding = isCollapsed ? 'px-0' : 'px-2';
  const computedWidth = isOpen ? 280 : isCollapsed ? 64 : 280;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col ${mobileTranslate} md:translate-x-0 ${sidebarWidthClass}`}
        animate={{ width: computedWidth }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{
          background: 'var(--sidebar)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRight: '1px solid var(--border)',
          width: computedWidth,
        }}
      >
{/* Logo and collapse toggle */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className={`flex items-center gap-1.5 ${isCollapsed ? 'justify-center w-full' : ''}`}>
              <div
                className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 glow-logo"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}
                title="Өз логотипіңізді осы жерге қойыңыз"
              >
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M10 8C10 6.895 10.895 6 12 6H20C23.866 6 27 9.134 27 13C27 15.387 25.664 17.461 23.732 18.555C26.099 19.451 28 21.526 28 24C28 27.314 25.314 30 22 30H12C10.895 30 10 29.105 10 28V8Z"
                    fill="white"
                  />
                  <path
                    d="M15 12H19C20.657 12 22 13.343 22 15C22 16.657 20.657 18 19 18H15V12Z"
                    fill="rgba(124,58,237,0.5)"
                  />
                  <path
                    d="M15 21H20C21.657 21 23 22.343 23 24C23 25.657 21.657 27 20 27H15V21Z"
                    fill="rgba(124,58,237,0.5)"
                  />
                </svg>
              </div>
              {!isCollapsed && (
                <div>
                  <div className="font-semibold" style={{ color: 'var(--foreground)', fontSize: '12px' }}>
                    Bext AI
                  </div>
                  <div className="text-xs" style={{ color: 'var(--muted-foreground)', fontSize: '10px' }}>
                    Оқу
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
              >
                <XIcon size={18} />
              </button>
            </div>
          </div>

          <div className={isCollapsed ? 'flex justify-center' : 'block'}>
            <AnimatePresence>
              {!isCollapsed ? (
                <motion.button
                  onClick={onNewChat}
                  className="w-full h-9 rounded-lg flex items-center justify-center gap-1.5 text-xs font-medium transition-all"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Жаңа чат</span>
                </motion.button>
              ) : (
                <motion.button
                  onClick={onNewChat}
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  title="Жаңа чат"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

      {/* API key warning */}
      <AnimatePresence>
        {!apiKey && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-2 mb-1.5"
          >
            <button
              onClick={() => onSectionChange('settings')}
              className="w-full px-2 py-1.5 rounded-lg text-xs flex items-center gap-1.5"
              style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                color: '#D97706',
              }}
            >
              <Sparkles size={12} className="flex-shrink-0" />
              <span className="text-left text-xs">API кілт →</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Navigation */}
      <div className={`${sectionPadding} mb-0.5`}>
        {!isCollapsed && (
          <p className="text-xs px-2 mb-1 font-medium" style={{ color: 'var(--muted-foreground)', opacity: 0.6 }}>
            Негізгі
          </p>
        )}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => {
                onSectionChange(item.id);
                onClose();
              }}
              className={`w-full h-9 px-2 rounded-lg flex items-center gap-2 text-xs mb-0.5 transition-all ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              style={{
                background: isActive ? 'var(--sidebar-accent)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: isActive ? '500' : '400',
                cursor: 'pointer',
              }}
              whileHover={{
                background: isActive ? 'var(--sidebar-accent)' : 'rgba(0,0,0,0.04)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`flex items-center justify-center rounded-full ${isActive ? 'bg-primary/10' : 'bg-transparent'} w-8 h-8`}
              >
                <Icon
                  size={14}
                  className="flex-shrink-0"
                  style={{ opacity: isActive ? 1 : 0.7 }}
                  strokeWidth={isActive ? 2 : 1.8}
                />
              </div>
              {!isCollapsed && (
                <>
                  <span className="truncate" style={{ fontSize: '13px' }}>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {!isCollapsed && (
        <div className="px-2 flex-1 overflow-hidden flex flex-col min-h-0">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between px-2 py-1 mb-1 rounded-lg"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <span className="text-xs font-medium" style={{ opacity: 0.6 }}>
              Соңғы
            </span>
            <motion.div animate={{ rotate: showHistory ? 90 : 0 }}>
              <ChevronRight size={12} />
            </motion.div>
          </button>

          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex-1 overflow-y-auto space-y-0.5 pr-0.5"
                style={{ maxHeight: '160px' }}
              >
                {historyItems.length === 0 ? (
                  <p className="text-xs px-2 py-3 text-center" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                    Тарих жоқ
                  </p>
                ) : (
                  historyItems.slice(0, 8).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { onSectionChange('history'); onClose(); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-all group hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--foreground)' }}
                    >
                      <div className="flex items-start gap-1.5">
                        <MessageSquare
                          size={11}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: 'var(--muted-foreground)' }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-xs" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                            {item.title}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--muted-foreground)', opacity: 0.5 }}>
                            {formatDate(item.timestamp)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className={`${sectionPadding} pb-3 pt-2`} style={{ borderTop: '1px solid var(--border)' }}>
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => { onSectionChange(item.id); onClose(); }}
              className={`w-full h-9 px-2 rounded-lg flex items-center gap-2 text-xs mb-0.5 transition-all ${isCollapsed ? 'justify-center' : 'justify-start'}`}
              style={{
                background: isActive ? 'var(--sidebar-accent)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                fontWeight: isActive ? '500' : '400',
                cursor: 'pointer',
              }}
              whileHover={{
                background: isActive ? 'var(--sidebar-accent)' : 'rgba(0,0,0,0.04)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={`flex items-center justify-center rounded-full ${isActive ? 'bg-primary/10' : 'bg-transparent'} w-8 h-8`}
              >
                <Icon
                  size={14}
                  className="flex-shrink-0"
                  style={{ opacity: isActive ? 1 : 0.7 }}
                  strokeWidth={isActive ? 2 : 1.8}
                />
              </div>
              {!isCollapsed && (
                <>
                  <span className="truncate" style={{ fontSize: '13px' }}>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--primary)' }}
                    />
                  )}
                </>
              )}
            </motion.button>
          );
        })}
      </div>

    </motion.aside>
    </>
  );
}