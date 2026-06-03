import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  format,
  isSameDay,
  addDays,
  isPast,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addMonths,
  subMonths,
  differenceInDays,
  differenceInHours
} from 'date-fns';
import { kk } from 'date-fns/locale';
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  GraduationCap,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Timer
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { chatCompletion, type ChatMessage } from '../../lib/openrouter';

export type EventType = 'study' | 'deadline' | 'exam' | 'other';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface ScheduleEvent {
  id: string;
  title: string;
  date: Date | string | number;
  time?: string;
  type: EventType;
  description?: string;
  isCompleted: boolean;
  priority: TaskPriority;
}

interface SchedulePanelProps {
  events: ScheduleEvent[];
  onAddEvent: (event: Omit<ScheduleEvent, 'id'>) => void;
  onUpdateEvent: (event: ScheduleEvent) => void;
  onDeleteEvent: (id: string) => void;
  onAutoPlan: (topics: string[], days: number) => void;
  apiKey?: string;
}

const typeConfig = {
  study: { icon: BookOpen, label: 'Оқу сессиясы', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  deadline: { icon: AlertCircle, label: 'Дедлайн', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
  exam: { icon: GraduationCap, label: 'Емтихан', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  other: { icon: Clock, label: 'Басқа', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' }
};

const priorityConfig = {
  high: { label: 'Жоғары', color: '#EF4444' },
  medium: { label: 'Орташа', color: '#F59E0B' },
  low: { label: 'Төмен', color: '#10B981' }
};

export function SchedulePanel({ events, onAddEvent, onUpdateEvent, onDeleteEvent, onAutoPlan, apiKey }: SchedulePanelProps) {
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Quick Add State
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<EventType>('study');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [description, setDescription] = useState('');
  const [autoTopics, setAutoTopics] = useState('');
  const [autoDays, setAutoDays] = useState(7);

  // AI Assistant State
  const [aiInput, setAiInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'Сәлем! Мен сіздің оқу кестеңізді жоспарлауға көмектесетін AI ассистентпін. Алда қандай емтихандар немесе дедлайндар бар? Қалай жоспар құрайық?' }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Normalize dates
  const normalizedEvents = useMemo(() => {
    return events.map(e => ({
      ...e,
      parsedDate: new Date(e.date)
    }));
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    return normalizedEvents
      .filter(e => isSameDay(e.parsedDate, selectedDate))
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        return 0;
      });
  }, [normalizedEvents, selectedDate]);

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Next Deadline Logic
  const nextDeadline = useMemo(() => {
    const upcoming = normalizedEvents
      .filter(e => !e.isCompleted && (e.type === 'exam' || e.type === 'deadline') && !isPast(e.parsedDate))
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    return upcoming[0] || null;
  }, [normalizedEvents]);

  const timeToDeadline = useMemo(() => {
    if (!nextDeadline) return null;
    const now = new Date();
    const days = differenceInDays(nextDeadline.parsedDate, now);
    const hours = differenceInHours(nextDeadline.parsedDate, now) % 24;
    return { days, hours };
  }, [nextDeadline]);

  // Scroll AI Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;
    onAddEvent({
      title: quickTaskTitle,
      date: selectedDate,
      type: 'study',
      priority: 'medium',
      isCompleted: false
    });
    setQuickTaskTitle('');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddEvent({
      title,
      date: selectedDate,
      time: time || undefined,
      type,
      priority,
      description: description || undefined,
      isCompleted: false
    });
    setIsAddModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTime('');
    setType('study');
    setPriority('medium');
    setDescription('');
  };

  const handleAutoPlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const topics = autoTopics
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean);

    if (topics.length === 0 || autoDays < 1) {
      return;
    }

    onAutoPlan(topics, autoDays);
    setAutoTopics('');
    setAutoDays(7);
  };

  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return;
    
    const userMsg = aiInput;
    setAiInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsAiThinking(true);

    try {
      if (!apiKey) {
        await new Promise(r => setTimeout(r, 1000));
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: 'Кешіріңіз, OpenRouter API кілті орнатылмаған. Баптаулар бөлімінде кілтті енгізіңіз.' 
        }]);
        return;
      }

      const prompt = `Сен оқуды жоспарлауға арналған AI ассистентсің. Оқушының мақсаттарына жетуіне, дедлайндарын басқаруына және сабақ кестесін тиімді құруына көмектес. Жауапты тек қазақ тілінде бер.
      
Ағымдағы күн: ${format(new Date(), 'dd.MM.yyyy')}.
      
Пайдаланушы сұрағы: ${userMsg}`;

      const apiMessages: ChatMessage[] = [
        { role: 'system', content: prompt },
        ...chatHistory.slice(-4), // keep recent context
        { role: 'user', content: userMsg }
      ];

      const response = await chatCompletion(apiMessages, apiKey, 'openrouter/free');
      
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      
    } catch (error: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Қателік орын алды: ' + (error.message || 'Белгісіз қате') }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden bg-[var(--background)]">
      
      {/* LEFT COLUMN: Premium Calendar & Widgets */}
      <div className="w-full md:w-[360px] lg:w-[400px] flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--card)] z-10 overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <CalendarDays className="text-[var(--primary)]" />
            Ақылды күнтізбе
          </h1>

          {/* Countdown Widget */}
          {nextDeadline && timeToDeadline && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl relative overflow-hidden text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${typeConfig[nextDeadline.type].color}, #1F2937)`
              }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Timer size={64} />
              </div>
              <div className="relative z-10">
                <span className="text-xs font-medium uppercase tracking-wider opacity-80 mb-1 block">
                  Келесі маңызды оқиға
                </span>
                <h3 className="font-semibold text-lg mb-3 truncate pr-12">{nextDeadline.title}</h3>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md">
                    {timeToDeadline.days} <span className="text-sm font-medium opacity-80">күн</span>
                  </div>
                  <div className="text-3xl font-bold bg-white/20 px-3 py-1 rounded-xl backdrop-blur-md">
                    {timeToDeadline.hours} <span className="text-sm font-medium opacity-80">сағ</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Custom Calendar UI */}
          <div className="glass rounded-2xl p-4 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)] capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: kk })}
              </h2>
              <div className="flex gap-1">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => setCurrentMonth(new Date())} className="px-2 text-xs font-medium rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
                  Бүгін
                </button>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн', 'Жс'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-[var(--muted-foreground)] py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              <AnimatePresence mode="popLayout">
                {calendarDays.map((day, idx) => {
                  const dayEvents = normalizedEvents.filter(e => isSameDay(e.parsedDate, day));
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isTodayDate = isToday(day);

                  return (
                    <motion.button
                      key={day.toString()}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      onClick={() => setSelectedDate(day)}
                      className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-sm transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[var(--primary)] text-white font-bold shadow-md scale-105 z-10' 
                          : isTodayDate
                            ? 'border border-[var(--primary)] text-[var(--primary)] font-bold bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20'
                            : !isCurrentMonth
                              ? 'text-[var(--muted-foreground)] opacity-50 hover:bg-[var(--muted)]/50'
                              : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                      }`}
                    >
                      <span className="relative z-10">{format(day, 'd')}</span>
                      
                      {/* Event Dots */}
                      {dayEvents.length > 0 && (
                        <div className="absolute bottom-1.5 flex gap-0.5 justify-center w-full">
                          {dayEvents.slice(0, 3).map((e, i) => (
                            <div 
                              key={i} 
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : ''}`}
                              style={{ backgroundColor: !isSelected ? typeConfig[e.type].color : undefined }}
                            />
                          ))}
                          {dayEvents.length > 3 && <div className="w-1.5 h-1.5 rounded-full bg-[var(--muted-foreground)]" />}
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN: Task List */}
      <div className="flex-1 flex flex-col bg-[var(--background)]/50 relative min-h-0 border-r border-[var(--border)]">
        
        {/* Header & Quick Add */}
        <div className="sticky top-0 z-20 glass border-b border-[var(--border)] px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-semibold text-[var(--foreground)] capitalize flex items-center gap-2">
                {format(selectedDate, 'd MMMM, EEEE', { locale: kk })}
                {isToday(selectedDate) && <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/20 text-[var(--primary)]">Бүгін</span>}
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddModalOpen(true)}
              className="p-2.5 rounded-xl bg-[var(--primary)] text-white shadow-md hover:shadow-lg transition-shadow flex items-center gap-2"
            >
              <Plus size={20} />
              <span className="hidden sm:inline font-medium pr-1">Жаңа</span>
            </motion.button>
          </div>

          <form onSubmit={handleQuickAdd} className="relative">
            <input 
              type="text" 
              value={quickTaskTitle}
              onChange={e => setQuickTaskTitle(e.target.value)}
              placeholder="Тапсырманы жылдам қосу (Enter басыңыз)..."
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
            />
            {quickTaskTitle && (
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--primary)] text-white rounded-lg">
                <Plus size={16} />
              </button>
            )}
          </form>

          <form onSubmit={handleAutoPlanSubmit} className="mt-4 grid gap-3 sm:grid-cols-[1.8fr_0.8fr] items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Жоспарлауға арналған тақырыптар</label>
              <input
                type="text"
                value={autoTopics}
                onChange={(e) => setAutoTopics(e.target.value)}
                placeholder="Мысалы: Математика, Информатика, Қазақ тілі"
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Күндер</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={autoDays}
                  onChange={(e) => setAutoDays(Number(e.target.value))}
                  className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all shadow-sm"
                />
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-[var(--primary)] text-white px-4 font-medium"
                >
                  Жоспарлау
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="popLayout">
            {selectedDateEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center text-[var(--muted-foreground)]"
              >
                <div className="w-24 h-24 mb-4 rounded-full bg-[var(--card)] border border-[var(--border)] flex items-center justify-center shadow-inner relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)] to-transparent opacity-10 rounded-full" />
                  <CalendarDays size={40} style={{ opacity: 0.4 }} />
                </div>
                <p className="text-xl font-medium mb-2 text-[var(--foreground)]">Тапсырмалар жоқ</p>
                <p className="text-sm max-w-[250px] mx-auto opacity-70">
                  Бұл күнге ештеңе жоспарланбаған. Демалыңыз немесе жаңа тапсырма қосыңыз.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => {
                  const TypeIcon = typeConfig[event.type].icon;
                  
                  return (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`group p-4 rounded-2xl border transition-all duration-300 ${
                        event.isCompleted 
                          ? 'bg-[var(--card)]/40 border-[var(--border)]/50 opacity-60' 
                          : 'glass hover:shadow-lg hover:-translate-y-0.5'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => onUpdateEvent({ ...event, isCompleted: !event.isCompleted })}
                          className={`mt-0.5 flex-shrink-0 transition-all duration-300 ${
                            event.isCompleted ? 'text-green-500 scale-110' : 'text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:scale-110'
                          }`}
                        >
                          {event.isCompleted ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={`font-semibold text-lg truncate transition-all duration-300 ${event.isCompleted ? 'line-through text-[var(--muted-foreground)]' : 'text-[var(--foreground)]'}`}>
                              {event.title}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => onDeleteEvent(event.id)}
                                className="p-1.5 rounded-lg text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {event.description && (
                            <p className={`text-sm mb-3 line-clamp-2 ${event.isCompleted ? 'text-[var(--muted-foreground)]' : 'text-[var(--muted-foreground)]'}`}>
                              {event.description}
                            </p>
                          )}

                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {event.time && (
                              <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] flex items-center gap-1">
                                <Clock size={12} /> {event.time}
                              </span>
                            )}
                            <span 
                              className="text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-sm"
                              style={{ backgroundColor: typeConfig[event.type].bg, color: typeConfig[event.type].color }}
                            >
                              <TypeIcon size={12} />
                              {typeConfig[event.type].label}
                            </span>
                            
                            <span 
                              className="text-xs font-medium px-2 py-1 rounded-md border"
                              style={{ 
                                borderColor: priorityConfig[event.priority].color,
                                color: priorityConfig[event.priority].color,
                                backgroundColor: `${priorityConfig[event.priority].color}15`
                              }}
                            >
                              {priorityConfig[event.priority].label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* RIGHT COLUMN: AI Assistant */}
      <div className="w-full md:w-[350px] flex-shrink-0 flex flex-col bg-[var(--card)]/80 z-10">
        <div className="p-4 border-b border-[var(--border)] glass flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--foreground)] text-sm">AI Жоспарлаушы</h3>
            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider">Көмекші</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user' 
                    ? 'bg-[var(--primary)] text-white rounded-tr-sm' 
                    : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isAiThinking && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-2xl rounded-tl-sm px-4 py-3">
                <Loader2 size={16} className="animate-spin text-[var(--primary)]" />
              </div>
            </motion.div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t border-[var(--border)] glass">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendAiMessage(); }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              disabled={isAiThinking}
              placeholder="Қалай жоспар құрайық?..."
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-full pl-4 pr-12 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!aiInput.trim() || isAiThinking}
              className="absolute right-1 w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center disabled:opacity-50"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ADD EVENT MODAL */}
      <Dialog.Root open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 transition-all duration-300" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-md bg-[var(--card)]/90 backdrop-blur-xl rounded-3xl shadow-2xl z-50 p-6 border border-[var(--border)] overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--primary)] to-pink-500" />
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-[var(--foreground)]">
                Жаңа тапсырма
              </Dialog.Title>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 ml-1">Тақырыбы</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Мәт. сауаттылық тестін шешу"
                  className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 ml-1">Күн</label>
                  <div className="w-full bg-[var(--background)]/30 border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--foreground)] cursor-not-allowed opacity-70">
                    {format(selectedDate, 'dd.MM.yyyy')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 ml-1">Уақыт (міндетті емес)</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 ml-1">Түрі</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as EventType)}
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all appearance-none"
                  >
                    <option value="study">Оқу сессиясы</option>
                    <option value="deadline">Дедлайн</option>
                    <option value="exam">Емтихан</option>
                    <option value="other">Басқа</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 ml-1">Маңыздылығы</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all appearance-none"
                  >
                    <option value="low">Төмен</option>
                    <option value="medium">Орташа</option>
                    <option value="high">Жоғары</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5 ml-1">Сипаттама (міндетті емес)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Қосымша ақпарат..."
                  rows={3}
                  className="w-full bg-[var(--background)]/50 border border-[var(--border)] rounded-2xl px-4 py-3 text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl font-medium bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--border)] transition-colors"
                >
                  Болдырмау
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="flex-1 py-3 rounded-2xl font-medium bg-[var(--primary)] text-white disabled:opacity-50 hover:shadow-lg transition-all"
                >
                  Қосу
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
