import { Clock, MessageSquare, Trash2, Search, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

interface HistoryItem {
  id: string;
  title: string;
  timestamp: Date | string | number;
  messageCount?: number;
  lastUpdated?: Date | string | number;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelectItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onRenameItem?: (id: string, newTitle: string) => void;
}

export function HistoryPanel({ items, onSelectItem, onDeleteItem, onRenameItem }: HistoryPanelProps) {
  const [search, setSearch] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const filtered = items.filter((i) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    try {
      if (i.title?.toLowerCase().includes(q)) return true;
      const raw = localStorage.getItem(`bext_chat_${i.id}`);
      if (raw) {
        const msgs = JSON.parse(raw) as any[];
        for (const m of msgs) {
          const content = (typeof m.content === 'string' ? m.content : JSON.stringify(m.content || '')).toLowerCase();
          if (content.includes(q)) return true;
        }
      }
    } catch (err) {
      // ignore parsing errors
    }
    return false;
  });

  const formatTime = (d: Date | string | number) => {
    const date = typeof d === 'number' ? new Date(d) : typeof d === 'string' ? new Date(d) : d;
    if (!(date instanceof Date) || isNaN(date.getTime())) return 'Белгісіз';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    if (hours < 1) return `${Math.round(diff / 60000)} минут бұрын`;
    if (hours < 24) return `${Math.round(hours)} сағат бұрын`;
    if (hours < 48) return 'Кеше';
    return date.toLocaleDateString('kk-KZ', { day: 'numeric', month: 'long' });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div
        className="px-8 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Тарихта іздеу..."
            className="w-full h-9 pl-9 pr-4 rounded-xl text-sm outline-none max-w-sm"
            style={{
              background: 'var(--input-background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Clock size={40} style={{ color: 'var(--muted-foreground)', opacity: 0.3 }} className="mb-3" />
            <p style={{ color: 'var(--muted-foreground)' }}>
              {search ? 'Табылмады' : 'Тарих жоқ'}
            </p>
          </div>
        ) : (
          <div className="max-w-3xl space-y-2">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                }}
                onClick={() => onSelectItem(item.id)}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.1)' }}
                >
                  <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    {renameId === item.id ? (
                      <input
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const newTitle = renameText.trim() || item.title;
                            onRenameItem?.(item.id, newTitle);
                            setRenameId(null);
                          } else if (e.key === 'Escape') {
                            setRenameId(null);
                          }
                        }}
                        onBlur={() => setRenameId(null)}
                        className="w-full text-sm px-2 py-1 rounded-md"
                      />
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <h3 className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>
                          {item.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameId(item.id);
                            setRenameText(item.title || '');
                          }}
                          title="Переименовать"
                          className="opacity-60 hover:opacity-100 transition-opacity p-1"
                          style={{ color: 'var(--muted-foreground)' }}
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    )}
                    <span className="text-xs flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                      {formatTime(item.lastUpdated || item.timestamp)}
                    </span>
                  </div>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    {item.messageCount ? `${item.messageCount} сөйлесім` : formatTime(item.timestamp)}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="opacity-60 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg flex-shrink-0"
                  style={{ color: '#EF4444' }}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
