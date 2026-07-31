import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bug,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Keyboard,
  Lightbulb,
  MessageSquare,
  MoonStar,
  Orbit,
  Paperclip,
  PanelRight,
  Plus,
  Send,
  Settings,
  Sparkles,
  Sun,
  TerminalSquare,
  Zap,
} from 'lucide-react';
import AnimatedBackground from './components/AnimatedBackground';
import TerminalMessage from './components/TerminalMessage';

const langMap = {
  js: 'js',
  javascript: 'js',
  ts: 'ts',
  typescript: 'ts',
  py: 'py',
  python: 'py',
  jsx: 'jsx',
  tsx: 'tsx',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cs: 'cs',
  go: 'go',
  rust: 'rs',
  ruby: 'rb',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  bash: 'sh',
  shell: 'sh',
  md: 'md',
  markdown: 'md',
  txt: 'txt',
};

const starterCards = [
  { title: 'Create React App', prompt: 'Create a modern React app starter with a polished landing page and clean components.' },
  { title: 'Generate Portfolio', prompt: 'Create a minimal portfolio website with a polished landing page and sections for work and contact.' },
  { title: 'Build Weather App', prompt: 'Build a clean weather app UI with a search box and forecast cards.' },
  { title: 'Create SQL Query', prompt: 'Write a SQL query for a user activity report with joins and filtering.' },
  { title: 'Fix My Code', prompt: 'Review the previous code and fix any obvious issues while keeping the intent intact.' },
  { title: 'Explain DSA', prompt: 'Explain a common data structure or algorithm in a simple and practical way.' },
  { title: 'Write Python Script', prompt: 'Write a helpful Python script for file processing with clear structure and comments.' },
  { title: 'Generate HTML Page', prompt: 'Generate a polished single-page HTML layout with modern styling and semantic structure.' },
];

const quickActions = [
  { id: 'explain', label: 'Explain Code', icon: Sparkles },
  { id: 'debug', label: 'Debug Code', icon: Bug },
  { id: 'optimize', label: 'Optimize Code', icon: Zap },
  { id: 'comments', label: 'Add Comments', icon: MessageSquare },
  { id: 'convert', label: 'Convert Language', icon: FileText },
  { id: 'copy', label: 'Copy Last Response', icon: Copy },
  { id: 'summarize', label: 'Summarize', icon: FileText },
  { id: 'improve', label: 'Improve Prompt', icon: Lightbulb },
];

export default function App() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem('naturalcli-theme');
    return stored === 'dark' || stored === 'light' ? stored : 'light';
  });
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'How can I help you today?' }]);
  const [isThinking, setIsThinking] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = window.localStorage.getItem('naturalcli-auto-scroll');
    return stored === 'false' ? false : true;
  });
  const [selectedFileContent, setSelectedFileContent] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [pinnedResponses, setPinnedResponses] = useState([]);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  const isEmptyState = messages.length === 1 && messages[0].content === 'How can I help you today?';
  const isDark = theme === 'dark';

  useEffect(() => {
    try {
      window.localStorage.setItem('naturalcli-theme', theme);
    } catch {
      // ignore storage errors
    }
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark, theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('naturalcli-auto-scroll', String(autoScroll));
    } catch {
      // ignore storage errors
    }
  }, [autoScroll]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (autoScroll) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, autoScroll]);

  const getLastUserMessage = () => [...messages].reverse().find((message) => message.role === 'user')?.content || '';
  const getLastAssistantMessage = () => [...messages].reverse().find((message) => message.role === 'assistant' && message.content !== 'How can I help you today?' && message.content !== 'New chat started. What would you like to do?')?.content || '';

  const extractCodeSnippet = (text = '') => {
    const match = text.match(/```(?:([\w#+-]+))?\s*([\s\S]*?)```/);
    if (!match) return { code: '', language: '' };
    return { code: match[2]?.trim() || '', language: (match[1] || '').toLowerCase() };
  };

  const submitPrompt = async (promptOverride) => {
    const prompt = (promptOverride ?? input).trim();
    if (!prompt || isThinking) return;

    setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setInput('');
    setIsThinking(true);
    setToastMessage('Sending request...');

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, fileContent: selectedFileContent }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage = data?.error || `Server returned ${response.status}`;
        throw new Error(errorMessage);
      }

      const reply = data?.reply || 'I could not produce a response right now.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      setToastMessage('Response received.');
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? 'Request timed out. Please try again.'
        : error?.message || 'The connection to the AI service was interrupted. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: message }]);
      setToastMessage(message);
    } finally {
      window.clearTimeout(timeoutId);
      setIsThinking(false);
    }
  };

  const handleCodeAction = async ({ action, code, language }) => {
    const promptMap = {
      explain: `Explain the following ${language || 'code'} step by step for a beginner. Keep the explanation concise and clear.\n\n${code}`,
      debug: `Find bugs in the following ${language || 'code'} and provide a corrected version with brief explanations.\n\n${code}`,
      optimize: `Optimize the following ${language || 'code'} for readability and performance while preserving the original behavior.\n\n${code}`,
      comments: `Rewrite the following ${language || 'code'} with detailed comments while keeping the implementation intact.\n\n${code}`,
    };

    const prompt = promptMap[action];
    if (!prompt) return;

    if (action === 'convert') {
      const targetLanguage = window.prompt('Enter a target language (for example: Python, JavaScript, TypeScript, Java):');
      if (!targetLanguage) return;
      await submitPrompt(`Convert the following ${language || 'code'} to ${targetLanguage}:\n\n${code}`);
      return;
    }

    await submitPrompt(prompt);
  };

  const handleDownloadCode = ({ code, language }) => {
    const ext = langMap[language?.toLowerCase()] || 'txt';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snippet.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleQuickAction = async (action) => {
    const lastAssistant = getLastAssistantMessage();
    const lastUser = getLastUserMessage();
    const { code, language } = extractCodeSnippet(lastAssistant);

    if (action === 'copy') {
      const responseToCopy = lastAssistant || lastUser;
      if (!responseToCopy) {
        setToastMessage('Nothing available to copy.');
        return;
      }
      try {
        await navigator.clipboard.writeText(responseToCopy);
        setToastMessage('Copied to clipboard.');
      } catch {
        setToastMessage('Failed to copy to clipboard.');
      }
      return;
    }

    let prompt = '';
    if (action === 'explain') {
      prompt = `Explain the previous code step by step for a beginner. If there is no code, explain the previous response in simple terms.\n\n${code || lastAssistant || lastUser}`;
    } else if (action === 'debug') {
      prompt = `Find bugs in the previous code and provide fixes. If there is no code, review the previous response for issues.\n\n${code || lastAssistant || lastUser}`;
    } else if (action === 'optimize') {
      prompt = `Optimize the previous code for readability and performance. If there is no code, suggest a cleaner version of the previous response.\n\n${code || lastAssistant || lastUser}`;
    } else if (action === 'comments') {
      prompt = `Rewrite the previous code with detailed comments while preserving the behavior.\n\n${code || lastAssistant || lastUser}`;
    } else if (action === 'convert') {
      const targetLanguage = window.prompt('Which language should I convert the previous code to?');
      if (!targetLanguage) return;
      prompt = `Convert the previous code to ${targetLanguage}. Keep the logic equivalent.\n\n${code || lastAssistant || lastUser}`;
    } else if (action === 'summarize') {
      prompt = `Summarize the previous AI response clearly and concisely.\n\n${lastAssistant || lastUser}`;
    } else if (action === 'improve') {
      prompt = `Rewrite the user's last prompt into a more effective AI prompt.\n\n${lastUser}`;
    }

    if (!prompt || !prompt.trim()) {
      setToastMessage('Nothing to process. Start by entering a prompt or selecting a quick action.');
      return;
    }

    const noContext = !code && !lastAssistant && !lastUser;
    const needsContext = ['explain', 'debug', 'optimize', 'comments', 'convert', 'summarize', 'improve'].includes(action);
    if (needsContext && noContext) {
      setToastMessage('Please send a prompt first before using this action.');
      return;
    }

    await submitPrompt(prompt);
  };

  const handleResponseAction = async (action, content) => {
    if (!content || !content.trim()) {
      setToastMessage('Nothing available to use for this action.');
      return;
    }

    if (action === 'copy') {
      try {
        await navigator.clipboard.writeText(content);
        setToastMessage('Copied full response.');
      } catch {
        setToastMessage('Failed to copy response.');
      }
      return;
    }

    if (action === 'download') {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'response.txt';
      link.click();
      URL.revokeObjectURL(url);
      setToastMessage('Downloaded response.');
      return;
    }

    let prompt = '';
    if (action === 'explain') {
      prompt = `Explain the following response in simple terms for a beginner while preserving the original meaning.\n\n${content}`;
    } else if (action === 'debug') {
      prompt = `Analyze the following response and identify any issues or improvements.\n\n${content}`;
    } else if (action === 'optimize') {
      prompt = `Optimize the following response for clarity, structure, and readability.\n\n${content}`;
    } else if (action === 'comments') {
      prompt = `Rewrite the following response with clear comments or annotations that explain each part.\n\n${content}`;
    } else if (action === 'convert') {
      const targetLanguage = window.prompt('Which language should I convert the response to?');
      if (!targetLanguage) return;
      prompt = `Convert the following response to ${targetLanguage}. Preserve the original meaning.\n\n${content}`;
    } else if (action === 'summarize') {
      prompt = `Summarize the following response clearly and concisely.\n\n${content}`;
    }

    if (!prompt.trim()) {
      setToastMessage('Action canceled.');
      return;
    }

    await submitPrompt(prompt);
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['text/plain', 'text/markdown', 'application/json', 'application/javascript', 'application/x-javascript', 'text/javascript', 'text/csv'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSize) {
      setFileError('File is too large. Please upload files smaller than 5MB.');
      event.target.value = '';
      return;
    }

    if (!allowedTypes.some((type) => file.type === type) && !file.name.match(/\.(txt|md|json|js|jsx|ts|tsx|csv|sql|py)$/i)) {
      setFileError('Unsupported file type. Please upload a supported text or code file.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    setUploadProgress(0);

    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setUploadProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    reader.onload = () => {
      const fileContent = String(reader.result || '');
      setSelectedFileName(file.name);
      setSelectedFileContent(fileContent.slice(0, 200000));
      setFileError('');
      setUploadProgress(100);
      setMessages((prev) => [...prev, { role: 'assistant', content: `File uploaded: ${file.name}. You can now ask questions about it.` }]);
      setToastMessage(`Uploaded ${file.name}`);
    };
    reader.onerror = () => {
      setFileError('There was an error reading the file. Please try again.');
      setUploadProgress(0);
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const startNewChat = () => {
    setMessages([{ role: 'assistant', content: 'How can I help you today?' }]);
    setInput('');
    setSelectedFileName('');
    setSelectedFileContent('');
    setFileError('');
    setIsThinking(false);
    setToastMessage('Started a new chat.');
  };

  const handlePinResponse = (response) => {
    if (!response) return;
    setPinnedResponses((prev) => (prev.includes(response) ? prev : [...prev, response].slice(-4)));
  };

  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      setInput('');
      setToastMessage('Input cleared.');
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitPrompt();
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-500 bg-white text-slate-900 dark:bg-[#030712] dark:text-white">
      <AnimatedBackground />
      <div className="w-[96%] mx-auto flex min-h-screen flex-col px-6 lg:px-10 py-4">
        {toastMessage && (
          <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
            <div role="status" className="rounded-2xl border border-slate-200 bg-slate-950/95 px-4 py-3 text-sm text-white shadow-xl shadow-slate-950/20 dark:border-white/10">
              {toastMessage}
            </div>
          </div>
        )}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border px-4 py-3 backdrop-blur-xl border-slate-200 bg-white/70 shadow-[0_20px_80px_rgba(15,23,42,0.08)] dark:border-gray-700 dark:bg-[#111827] dark:shadow-[0_20px_80px_rgba(3,10,20,0.45)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>
                <TerminalSquare size={18} />
              </div>
              <div>
                <p className="text-base font-semibold tracking-tight">NaturalCLI</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">AI terminal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm border-emerald-400/20 bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Online
              </div>
                <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm border-cyan-400/20 bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                <span className="font-medium">Gemini 3.5 (Flash Lite)</span>
              </div>
              <button
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="rounded-full border p-2.5 transition hover:-translate-y-0.5 border-slate-300 bg-white dark:border-gray-700 dark:bg-white/10"
              >
                {isDark ? <Sun size={16} /> : <MoonStar size={16} />}
              </button>
              <button
                onClick={startNewChat}
                className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition hover:-translate-y-0.5 border-slate-300 bg-white dark:border-gray-700 dark:bg-white/10"
              >
                <Plus size={16} /> New chat
              </button>
              <button
                onClick={() => window.open('https://github.com/abhjayy/naturalcli', '_blank', 'noopener,noreferrer')}
                className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition hover:-translate-y-0.5 border-slate-300 bg-white dark:border-gray-700 dark:bg-white/10"
              >
                <Orbit size={16} /> GitHub
              </button>
              <button
                onClick={() => setSettingsOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition hover:-translate-y-0.5 border-slate-300 bg-white dark:border-gray-700 dark:bg-white/10"
              >
                <Settings size={16} /> Settings
              </button>
              <button
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="rounded-full border p-2.5 transition hover:-translate-y-0.5 border-slate-300 bg-white dark:border-gray-700 dark:bg-white/10"
              >
                {sidebarOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          </div>

          {settingsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex flex-wrap items-center gap-3 rounded-[20px] border px-3 py-2 text-sm border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]"
            >
              <button
                onClick={() => setAutoScroll((prev) => !prev)}
                className={`rounded-full border px-3 py-1.5 transition ${autoScroll ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' : 'border-slate-200 bg-white/5 text-slate-500 dark:border-gray-700 dark:bg-[#111827] dark:text-slate-400'}`}
              >
                Auto-scroll {autoScroll ? 'On' : 'Off'}
              </button>
              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{autoScroll ? 'Auto-scroll is enabled' : 'Auto-scroll is disabled'}</span>
            </motion.div>
          )}
        </motion.header>

        <div className="mt-4 flex flex-1 gap-6">
          <motion.main
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 min-w-0 rounded-[30px] border p-3 backdrop-blur-xl shadow-[0_30px_90px_rgba(2,6,23,0.32)] border-slate-200 bg-white/70 dark:border-gray-700 dark:bg-[#111827]"
          >
            <div className="flex h-full flex-col">
              <div className={`flex-1 overflow-y-auto rounded-[24px] border p-4 sm:p-6 border-slate-200 bg-white/80 dark:border-gray-700 dark:bg-[linear-gradient(180deg,#111827,#030712)]`}>
                <div className="mx-auto flex h-full w-full flex-col gap-4">
                  {messages.map((message, index) => (
                    <TerminalMessage
                      key={`${message.role}-${index}`}
                      role={message.role}
                      content={message.content}
                      onCodeAction={handleCodeAction}
                      onDownloadCode={handleDownloadCode}
                      onResponseAction={handleResponseAction}
                    />
                  ))}
                  {isThinking && <TerminalMessage role="assistant" content="" isStreaming />}
                  {isEmptyState && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]"
                    >
                      <div className="rounded-[22px] border p-4 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <Sparkles size={15} className="text-cyan-400" /> Quick examples
                        </div>
                            <div className="grid gap-2">
                          {starterCards.map((card) => (
                            <button
                              key={card.title}
                              onClick={() => submitPrompt(card.prompt)}
                              className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition hover:-translate-y-0.5 border-slate-200 bg-white dark:border-gray-700 dark:bg-white/5`}
                            >
                              {card.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-[22px] border p-4 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <Keyboard size={15} className="text-cyan-400" /> Keyboard shortcuts
                          </div>
                          <div className="space-y-2 text-sm text-slate-400">
                            <div>Enter — send message</div>
                            <div>Ctrl/Cmd + K — clear input</div>
                            <div>Shift + Enter — new line</div>
                          </div>
                        </div>
                        <div className="rounded-[22px] border p-4 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <FileText size={15} className="text-cyan-400" /> Supported file types
                          </div>
                          <div className="space-y-2 text-sm text-slate-400">
                            <div>Plain text, Markdown, JSON, JavaScript, Python, SQL, CSV</div>
                            <div>Text and code files only, up to 5MB.</div>
                          </div>
                        </div>
                        <div className="rounded-[22px] border p-4 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                            <Lightbulb size={15} className="text-cyan-400" /> Tips
                          </div>
                          <div className="space-y-2 text-sm text-slate-400">
                            <div>Ask for code explanations, fixes, or refactors.</div>
                            <div>Upload files to get context-aware help.</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={endRef} />
                </div>
              </div>

              <div className="sticky bottom-0 mt-3 rounded-[24px] border p-3 border-slate-200 bg-white/80 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-gray-700 dark:bg-[#111827] dark:shadow-[0_12px_40px_rgba(2,6,23,0.28)]">
                <div className="mb-3 flex flex-wrap gap-2">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition hover:-translate-y-0.5 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#111827]"
                      >
                        <Icon size={14} className="text-cyan-400" /> {action.label}
                      </button>
                    );
                  })}
                </div>

                {selectedFileName && (
                  <div className="mb-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs border-cyan-400/20 bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-300">
                    Attached: {selectedFileName}
                  </div>
                )}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mb-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-cyan-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {uploadProgress === 100 && !fileError && (
                  <div className="mb-2 text-xs text-slate-500">Upload complete.</div>
                )}
                {fileError && (
                  <div className="mb-2 text-xs text-red-500">{fileError}</div>
                )}
                {uploadProgress > 0 && !fileError && uploadProgress < 100 && (
                  <div className="mb-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 rounded-full bg-cyan-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {uploadProgress === 100 && !fileError && (
                  <div className="mb-2 text-xs text-slate-500">Upload complete.</div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-2xl border px-3 py-2.5 text-sm transition hover:-translate-y-0.5 border-slate-300 bg-white dark:border-gray-700 dark:bg-white/10"
                  >
                    <Paperclip size={16} /> Upload
                  </button>

                  <div className="flex flex-1 items-center gap-2 rounded-2xl border px-3 py-2.5 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#111827]">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything..."
                      rows={2}
                      className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => submitPrompt()}
                    disabled={isThinking}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:-translate-y-0.5 ${isThinking ? 'cursor-not-allowed opacity-60 bg-slate-300 dark:bg-slate-700' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'}`}
                  >
                    <Send size={16} /> {isThinking ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </motion.main>

          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.aside
                initial={{ opacity: 0, x: 20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.24 }}
                className="hidden md:flex md:w-80 lg:w-[360px] shrink-0 rounded-[30px] border p-4 backdrop-blur-xl border-slate-200 bg-white/70 dark:border-gray-700 dark:bg-[#111827]"
              >
                <div className="flex w-full flex-col gap-3 sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Workspace</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Developer context</p>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="rounded-full border p-2 border-slate-300 bg-white dark:border-gray-700 dark:bg-white/10"
                    >
                      <PanelRight size={14} />
                    </button>
                  </div>

                  <div className="rounded-[20px] border p-3 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]">
                    <div className="text-sm font-medium">Conversation statistics</div>
                    <div className="mt-3 space-y-2 text-sm text-slate-400">
                      <div className="flex items-center justify-between"><span>Messages</span><span>{messages.length}</span></div>
                      <div className="flex items-center justify-between"><span>Tokens</span><span>{Math.max(140, messages.length * 110)}</span></div>
                      <div className="flex items-center justify-between"><span>Response time</span><span>{Math.max(240, messages.length * 180)}ms</span></div>
                    </div>
                  </div>

                  <div className="rounded-[20px] border p-3 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium">
                      <span>Uploaded files</span>
                      <span className="text-xs text-slate-400">{selectedFileName || 'None'}</span>
                    </div>
                    <div className="text-sm text-slate-400">{selectedFileName ? selectedFileName : 'Upload a file to attach context.'}</div>
                  </div>

                  <div className="rounded-[20px] border p-3 border-slate-200 bg-slate-50 dark:border-gray-700 dark:bg-[#1F2937]">
                    <div className="mb-2 flex items-center justify-between text-sm font-medium">
                      <span>Pinned responses</span>
                      <button onClick={() => handlePinResponse(getLastAssistantMessage())} className="text-xs text-cyan-400">Pin latest</button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-400">
                      {pinnedResponses.length ? pinnedResponses.map((item) => <div key={item} className="rounded-xl border border-slate-200 bg-white/5 p-2 text-xs dark:border-gray-700 dark:bg-[#111827]">{item.slice(0, 120)}{item.length > 120 ? '…' : ''}</div>) : <div>No pinned responses yet.</div>}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
