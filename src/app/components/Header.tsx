import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  isDark: boolean;
  onChangeThemeMode: (mode: 'light' | 'dark') => void;
  activeSection: string;
  sidebarCollapsed: boolean;
  onToggleSidebar?: () => void;
}

const sectionTitles: Record<string, string> = {
  home: 'Чат',
  dashboard: 'Менің жетістіктерім',
  formulas: 'Формулалар',
  cards: 'Флэш-карточкалар',
  test: 'Тесттер',
  history: 'Тарих',
  settings: 'Баптаулар',
  setup: 'Нұсқаулық',
};

export function Header({ isDark, onChangeThemeMode, activeSection, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1, marginLeft: sidebarCollapsed ? 64 : 280 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1, layout: { duration: 0.25, ease: 'easeInOut' } }}
      className="fixed top-0 right-0 h-[60px] z-40 flex items-center left-0"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 1px 0 0 var(--border), 0 2px 12px rgba(124,58,237,0.06)',
      }}
    >
      <div className="flex-1 px-6 flex items-center justify-between gap-6">
        {/* Section title & Menu */}
        <div className="flex items-center gap-3">
          <h2
            className="font-medium"
            style={{ color: 'var(--foreground)', fontSize: '15px' }}
          >
            {sectionTitles[activeSection] || 'Bext AI'}
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Compact toggle for mobile */}
          <motion.button
            onClick={() => onChangeThemeMode(isDark ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl flex items-center justify-center glow-btn"
            style={{
              background: 'var(--input-background)',
              border: '1px solid var(--border)',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isDark ? 'Күндізгі режим' : 'Түнгі режим'}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon size={15} style={{ color: 'var(--foreground)' }} />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun size={15} style={{ color: 'var(--foreground)' }} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
