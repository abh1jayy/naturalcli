import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Sparkles, UserRound, Bot } from 'lucide-react';
import { useState } from 'react';

const codeActions = [
  { key: 'copy', label: 'Copy Code', emoji: '📋' },
  { key: 'explain', label: 'Explain Code', emoji: '✨' },
  { key: 'debug', label: 'Debug Code', emoji: '🐞' },
  { key: 'optimize', label: 'Optimize Code', emoji: '⚡' },
  { key: 'comments', label: 'Add Comments', emoji: '💬' },
  { key: 'convert', label: 'Convert Language', emoji: '🔄' },
  { key: 'download', label: 'Download Code', emoji: '⬇' },
];

export default function TerminalMessage({ role, content, isStreaming = false, onCodeAction, onDownloadCode }) {
  const [copiedBlock, setCopiedBlock] = useState('');
  const [pendingAction, setPendingAction] = useState('');

  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedBlock(value);
      setTimeout(() => setCopiedBlock(''), 1400);
    } catch {}
  };

  const handleCodeAction = async (action, code, language) => {
    if (action === 'copy') {
      await copyToClipboard(code);
      return;
    }

    if (action === 'download') {
      onDownloadCode?.({ code, language });
      return;
    }

    setPendingAction(`${action}-${language}`);
    try {
      await onCodeAction?.({ action, code, language });
    } finally {
      setPendingAction('');
    }
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
            onClick={() => copyToClipboard(codeString)}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
          >
            {copiedBlock === codeString ? 'Copied' : 'Copy'}
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

        <div className="grid gap-2 border-t border-white/10 bg-slate-950/70 p-2 sm:grid-cols-2 lg:grid-cols-4">
          {codeActions.map((action) => {
            const actionKey = `${action.key}-${normalizedLanguage}`;
            const isBusy = pendingAction === actionKey;
            return (
              <button
                key={action.key}
                onClick={() => handleCodeAction(action.key, codeString, normalizedLanguage)}
                disabled={isBusy}
                className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-left text-[11px] text-slate-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/10 disabled:opacity-70"
              >
                <span className="mr-1">{action.emoji}</span>
                {action.label}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const isUser = role === 'user';

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

      <div className={`max-w-[90%] lg:max-w-[1100px] rounded-3xl border px-4 py-3 backdrop-blur-xl ${isUser ? 'border-cyan-400/20 bg-cyan-400/10 text-slate-100' : 'border-white/10 bg-slate-950/60 text-slate-100'}`}>
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

                  return <code className="rounded bg-white/10 px-1.5 py-1 text-sm text-cyan-200">{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {isUser && (
        <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/15 text-cyan-200">
          <UserRound size={16} />
        </div>
      )}
    </motion.div>
  );
}
