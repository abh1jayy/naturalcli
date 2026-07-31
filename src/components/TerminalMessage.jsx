import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Sparkles, UserRound, Bot, Bug, Zap, MessageSquare, FileText, Download } from 'lucide-react';
import { useState } from 'react';

const codeActions = [
  { key: 'copy', label: 'Copy Code', emoji: '📋' },
];

const responseActions = [
  { key: 'copy', label: 'Copy Response', icon: Copy },
  { key: 'explain', label: 'Explain', icon: Sparkles },
  { key: 'debug', label: 'Debug', icon: Bug },
  { key: 'optimize', label: 'Optimize', icon: Zap },
  { key: 'comments', label: 'Add Comments', icon: MessageSquare },
  { key: 'convert', label: 'Convert', icon: FileText },
  { key: 'summarize', label: 'Summarize', icon: FileText },
  { key: 'download', label: 'Download', icon: Download },
];

export default function TerminalMessage({ role, content, isStreaming = false, onResponseAction }) {
  const [copiedBlock, setCopiedBlock] = useState('');

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedBlock(value);
      setTimeout(() => setCopiedBlock(''), 1400);
    } catch {}
  };

  const renderCodeBlock = (codeString, language) => {
    const normalizedLanguage = language || 'text';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0b1220] shadow-[0_20px_50px_rgba(0,0,0,0.24)]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-slate-400">
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] text-cyan-300">
              {normalizedLanguage}
            </span>
            <span>code</span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(codeString)}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
          >
            {copiedBlock === codeString ? 'Copied' : 'Copy Code'}
          </button>
        </div>

        <SyntaxHighlighter
          style={oneDark}
          language={normalizedLanguage}
          showLineNumbers
          wrapLongLines
          PreTag="div"
          lineNumberStyle={{ color: 'rgba(255,255,255,0.35)', paddingRight: '1rem' }}
          customStyle={{ margin: 0, background: '#0b1220', padding: '1rem' }}
        >
          {codeString}
        </SyntaxHighlighter>
      </motion.div>
    );
  };

  const isUser = role === 'user';
  const isWelcomeMessage = content?.trim() === 'How can I help you today?';
  const showToolbar = !isUser && !isStreaming && content?.trim() && !isWelcomeMessage;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-emerald-300 shadow-[0_0_30px_rgba(0,255,157,0.15)]">
          <Bot size={16} />
        </div>
      )}

      <div className={`max-w-[90%] lg:max-w-[1100px] rounded-3xl border px-4 py-3 backdrop-blur-xl ${isUser ? 'border-cyan-400/20 bg-cyan-400/10 text-slate-900 dark:text-slate-100 dark:bg-cyan-400/10' : 'border-slate-200 bg-slate-50 text-slate-900 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100'}`}>
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-slate-400">
          {isUser ? <UserRound size={13} /> : <Sparkles size={13} />}
          {isUser ? 'You' : 'NaturalCLI'}
        </div>

        <div className="prose prose-invert max-w-none prose-p:my-2 prose-pre:my-3 prose-pre:overflow-hidden prose-pre:rounded-2xl prose-code:text-[0.9em]">
          {isStreaming ? (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300 [animation-delay:120ms]" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-fuchsia-300 [animation-delay:240ms]" />
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline && match) {
                    return renderCodeBlock(codeString, match[1]);
                  }

                  if (!inline) {
                    return renderCodeBlock(codeString, 'text');
                  }

                  return <code className="rounded bg-slate-100 px-1.5 py-1 text-sm text-slate-900 dark:bg-white/10 dark:text-cyan-200">{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>

        {showToolbar && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 shadow-sm shadow-slate-950/5 dark:border-white/10 dark:bg-white/5">
            {responseActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => onResponseAction?.(action.key, content)}
                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[12px] font-medium text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  <Icon size={14} /> {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/15 text-cyan-200">
          <UserRound size={16} />
        </div>
      )}
    </motion.div>
  );
}
