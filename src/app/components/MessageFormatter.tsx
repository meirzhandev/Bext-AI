import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';

import { ErrorBoundary } from './ErrorBoundary';

interface MessageFormatterProps {
  content: string;
  isDark?: boolean;
  onExplainStep?: (stepNumber: number, stepContent: string) => void;
}

export function MessageFormatter({ content, isDark = false, onExplainStep }: MessageFormatterProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const normalizeMathDelimiters = (text: string) => {
    let result = text;

    // Convert display math delimiters from \[...\] to $$...$$
    result = result.replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_, content) => `$$${content.trim()}$$`);

    // Convert inline math delimiters from \(...\) to $...$
    result = result.replace(/\\\(\s*([\s\S]*?)\s*\\\)/g, (_, content) => `$${content.trim()}$`);

    return result;
  };

  // ─── Markdown Renderer ───
  const renderMarkdown = (text: string) => {
    const normalized = normalizeMathDelimiters(text);

    return (
      <ErrorBoundary fallbackMessage="Мәтінді немесе формуланы өңдеу кезінде қателік кетті.">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              const codeString = String(children).replace(/\n$/, '');

              if (!inline && match) {
                const language = match[1];
                return (
                  <div className="relative group my-4">
                    <div
                      className="absolute right-2 top-2 z-10 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        onClick={() => handleCopyCode(codeString)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                        style={{
                          background: 'rgba(0,0,0,0.6)',
                          color: 'white',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {copiedCode === codeString ? (
                          <>
                            <Check size={12} />
                            Көшірілді
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            Көшіру
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ background: isDark ? '#1e1e1e' : '#f5f5f5' }}>
                      <div
                        className="px-4 py-2 text-xs font-medium border-b"
                        style={{
                          background: isDark ? '#2d2d2d' : '#e5e5e5',
                          color: isDark ? '#cccccc' : '#666666',
                          borderColor: isDark ? '#3e3e3e' : '#d4d4d4',
                        }}
                      >
                        {language}
                      </div>
                      <SyntaxHighlighter
                        style={isDark ? vscDarkPlus : vs}
                        language={language}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: '16px',
                          background: isDark ? '#1e1e1e' : '#f5f5f5',
                          fontSize: '13px',
                          lineHeight: '1.6',
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily: 'var(--font-mono)',
                          },
                        }}
                        {...props}
                      >
                        {codeString}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                );
              }

              return (
                <code
                  className="px-1.5 py-0.5 rounded text-sm"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    color: isDark ? '#e879f9' : '#7C3AED',
                    fontFamily: 'var(--font-mono)',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p({ children }) {
              return <p className="mb-3 leading-relaxed">{children}</p>;
            },
            ul({ children }) {
              return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
            },
            ol({ children }) {
              return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
            },
            li({ children }) {
              return <li className="leading-relaxed">{children}</li>;
            },
            strong({ children }) {
              return <strong className="font-semibold">{children}</strong>;
            },
            em({ children }) {
              return <em className="italic">{children}</em>;
            },
            h1({ children }) {
              return <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>;
            },
            h2({ children }) {
              return <h2 className="text-xl font-bold mb-3 mt-4">{children}</h2>;
            },
            h3({ children }) {
              return <h3 className="text-lg font-semibold mb-2 mt-3">{children}</h3>;
            },
            blockquote({ children }) {
              return (
                <blockquote
                  className="border-l-4 pl-4 py-2 my-3 italic"
                  style={{ borderColor: 'var(--primary)', background: 'rgba(124,58,237,0.05)' }}
                >
                  {children}
                </blockquote>
              );
            },
            a({ href, children }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: 'var(--primary)' }}
                >
                  {children}
                </a>
              );
            },
            table({ children }) {
              return (
                <div className="overflow-x-auto my-4">
                  <table className="min-w-full border-collapse" style={{ borderColor: 'var(--border)' }}>
                    {children}
                  </table>
                </div>
              );
            },
            thead({ children }) {
              return (
                <thead style={{ background: 'var(--input-background)', borderBottom: '2px solid var(--border)' }}>
                  {children}
                </thead>
              );
            },
            tbody({ children }) {
              return <tbody>{children}</tbody>;
            },
            tr({ children }) {
              return <tr style={{ borderBottom: '1px solid var(--border)' }}>{children}</tr>;
            },
            th({ children }) {
              return (
                <th className="px-4 py-2 text-left font-semibold" style={{ color: 'var(--foreground)' }}>
                  {children}
                </th>
              );
            },
            td({ children }) {
              return (
                <td className="px-4 py-2" style={{ color: 'var(--foreground)' }}>
                  {children}
                </td>
              );
            },
          }}
        >
          {normalized}
        </ReactMarkdown>
      </ErrorBoundary>
    );
  };

  // ─── Step-by-Step Parser ───
  const stepPattern = /(?:^|\n)(?:\*\*)?(?:Қадам|Step)\s+\d+[:.]?(?:\*\*)?\s+/i;
  
  if (stepPattern.test(content)) {
    const sections = content.split(new RegExp(`(?:^|\\n)(?:\\*\\*)?(?:Қадам|Step)\\s+\\d+[:.]?(?:\\*\\*)?\\s+`, 'i'));
    const preamble = sections[0];
    const steps = sections.slice(1);

    return (
      <div className="message-content -mt-1">
        {preamble.trim() && (
          <div className="mb-4">{renderMarkdown(preamble)}</div>
        )}
        
        {steps.length > 0 && (
          <div className="relative pl-7 space-y-5 mt-2 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-gradient-to-b before:from-[var(--primary)] before:to-[var(--border)]">
            {steps.map((stepContent, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: idx * 0.1 }}
                className="relative"
              >
                <div 
                  className="absolute -left-[35px] top-0 w-[18px] h-[18px] rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-[10px] font-bold z-10"
                  style={{ boxShadow: '0 0 0 4px var(--background)' }}
                >
                  {idx + 1}
                </div>
                <div 
                  className="bg-[var(--card)] rounded-xl px-4 py-3 border border-[var(--border)] relative group"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                >
                  {renderMarkdown(stepContent)}
                  
                  {onExplainStep && (
                    <button
                      onClick={() => onExplainStep(idx + 1, stepContent)}
                      className="absolute -bottom-2.5 right-4 opacity-60 group-hover:opacity-100 transition-opacity bg-[var(--primary)] text-white text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm hover:opacity-90 active:scale-95"
                    >
                      <Sparkles size={11} /> Осы қадамды толығырақ түсіндіру
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Normal render
  return (
    <div className="message-content">
      {renderMarkdown(content)}
    </div>
  );
}
