import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calculator, Triangle, Cpu, Copy, Check, Hash } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { formulasData, type FormulaCategory } from '../../lib/formulaData';

interface FormulaCardProps {
  formula: typeof formulasData[0];
}

function FormulaCard({ formula }: FormulaCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula.latex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const html = useMemo(() => {
    try {
      return katex.renderToString(formula.latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch (e) {
      return formula.latex;
    }
  }, [formula.latex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl flex flex-col group relative"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>
          {formula.name}
        </h3>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ background: 'var(--input-background)', border: '1px solid var(--border)' }}
          title="LaTeX кодты көшіру"
        >
          {copied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} style={{ color: 'var(--muted-foreground)' }} />}
        </button>
      </div>
      
      <div 
        className="flex-1 py-4 flex items-center justify-center overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      
      <p className="text-xs mt-3 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
        {formula.description}
      </p>
    </motion.div>
  );
}

export function FormulaReference() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FormulaCategory | 'all'>('all');

  const categories = [
    { id: 'all', label: 'Барлығы', icon: Hash },
    { id: 'algebra', label: 'Алгебра', icon: Calculator },
    { id: 'geometry', label: 'Геометрия', icon: Triangle },
    { id: 'informatics', label: 'Информатика', icon: Cpu },
  ] as const;

  const filteredFormulas = useMemo(() => {
    return formulasData.filter((f) => {
      const matchCat = activeCategory === 'all' || f.category === activeCategory;
      const term = search.toLowerCase();
      const matchSearch = 
        f.name.toLowerCase().includes(term) || 
        f.description.toLowerCase().includes(term) ||
        f.keywords.some(k => k.toLowerCase().includes(term));
      
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Формулалар мен Ережелер
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
          ҰБТ-ға дайындық үшін қажетті негізгі формулалар жинағы
        </p>

        <div className="flex flex-col md:flex-row gap-4 mb-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Формуланы іздеу (мысалы: 'аудан', 'дискриминант')"
              className="w-full h-11 pl-10 pr-4 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: 'var(--input-background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar shrink-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as FormulaCategory | 'all')}
                  className="h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? 'var(--primary)' : 'var(--card)',
                    color: isActive ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  <Icon size={15} style={{ opacity: isActive ? 1 : 0.6 }} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {filteredFormulas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p style={{ color: 'var(--muted-foreground)' }}>Ештеңе табылмады. Басқаша іздеп көріңіз.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredFormulas.map((f) => (
                <FormulaCard key={f.id} formula={f} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
