import { useState, useCallback, useEffect, useRef } from 'react';
import { X, Send, Square, GitCompare, Loader2 } from 'lucide-react';
import { useComparisonStore } from '../stores/comparisonStore';
import { useProviderStore } from '../stores/providerStore';
import { getModelById, getApiBaseUrl } from '../lib/provider-adapter';
import { DEFAULT_DEEPSEEK_MODEL } from '../types';
import { streamChat } from '../lib/stream';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ComparisonPanelProps {
  open: boolean;
  onClose: () => void;
  darkMode: boolean;
  initialPrompt?: string;
}

export function ComparisonPanel({ open, onClose, darkMode, initialPrompt }: ComparisonPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt ?? '');
  const [leftModel, setLeftModel] = useState(DEFAULT_DEEPSEEK_MODEL);
  const [rightModel, setRightModel] = useState('gpt-4o-mini');
  const [leftProvider, setLeftProvider] = useState('deepseek');
  const [rightProvider, setRightProvider] = useState('openai');
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [leftStatus, setLeftStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  const [rightStatus, setRightStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  const [leftReasoning, setLeftReasoning] = useState('');
  const [rightReasoning, setRightReasoning] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const providers = useProviderStore((s) => s.providers);

  const getBaseUrl = (pid: string) => {
    const p = providers.find((x) => x.id === pid);
    return p?.baseUrl ?? '/api/chat';
  };

  const handleCompare = useCallback(async () => {
    if (!prompt.trim()) return;
    setLeftContent('');
    setRightContent('');
    setLeftReasoning('');
    setRightReasoning('');
    setLeftStatus('streaming');
    setRightStatus('streaming');

    const abortController = new AbortController();
    abortRef.current = abortController;

    // Run both in parallel
    const runLeft = streamChat(
      {
        messages: [{ role: 'user', content: prompt }],
        model: leftModel,
        apiBase: getBaseUrl(leftProvider),
        streamOutput: true,
      },
      {
        signal: abortController.signal,
        onToken: (t) => setLeftContent((prev) => prev + t),
        onReasoning: (r) => setLeftReasoning((prev) => prev + r),
        onError: () => setLeftStatus('error'),
        onDone: () => setLeftStatus('done'),
      }
    );

    const runRight = streamChat(
      {
        messages: [{ role: 'user', content: prompt }],
        model: rightModel,
        apiBase: getBaseUrl(rightProvider),
        streamOutput: true,
      },
      {
        signal: abortController.signal,
        onToken: (t) => setRightContent((prev) => prev + t),
        onReasoning: (r) => setRightReasoning((prev) => prev + r),
        onError: () => setRightStatus('error'),
        onDone: () => setRightStatus('done'),
      }
    );

    await Promise.allSettled([runLeft, runRight]);
  }, [prompt, leftModel, rightModel, leftProvider, rightProvider, getBaseUrl]);

  const handleStop = () => {
    abortRef.current?.abort();
    setLeftStatus((s) => (s === 'streaming' ? 'done' : s));
    setRightStatus((s) => (s === 'streaming' ? 'done' : s));
  };

  if (!open) return null;

  const isLoading = leftStatus === 'streaming' || rightStatus === 'streaming';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${darkMode ? 'backdrop-blur-[50px] saturate-[200%] bg-black/[0.18]' : 'bg-gray-50'}`}>
      {/* Top bar */}
      <header className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-white/[0.06] bg-white/[0.03] backdrop-blur-[40px] saturate-[200%]' : 'border-gray-200 bg-white/80 backdrop-blur-xl'}`}>
        <div className="flex items-center gap-2.5">
          <GitCompare className="w-4 h-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white/80">模型对比</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Prompt input */}
      <div className="px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleCompare(); } }}
            placeholder="输入要对比的 prompt..."
            disabled={isLoading}
            className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none ${
              darkMode ? 'bg-white/[0.04] border border-white/[0.06] text-white/80 placeholder-gray-600' : 'bg-gray-50 border border-gray-200'
            }`}
          />
          {isLoading ? (
            <button onClick={handleStop} className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <Square className="w-4 h-4" fill="currentColor" />
            </button>
          ) : (
            <button onClick={handleCompare} disabled={!prompt.trim()} className="p-2 rounded-lg bg-purple-500/20 text-purple-400 disabled:opacity-30">
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Model labels */}
        <div className="flex items-center gap-4 mt-2 px-1">
          <span className="text-[10px] text-cyan-400/70 font-mono">{leftModel}</span>
          <span className="text-[10px] text-gray-600">vs</span>
          <span className="text-[10px] text-purple-400/70 font-mono">{rightModel}</span>
        </div>
      </div>

      {/* Side-by-side results */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column */}
        <div className="flex-1 border-r border-white/[0.04] overflow-y-auto p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] font-semibold text-cyan-400/70 uppercase">{leftModel}</span>
            {leftStatus === 'streaming' && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
          </div>
          {leftReasoning && (
            <div className="mb-3 p-3 rounded-lg bg-purple-500/[0.04] border border-purple-500/10">
              <span className="text-[10px] text-purple-400/70 block mb-1">思考过程</span>
              <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{leftReasoning}</p>
            </div>
          )}
          <div className="text-sm text-white/80 leading-relaxed">
            <MarkdownRenderer content={leftContent || '等待中...'} />
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] font-semibold text-purple-400/70 uppercase">{rightModel}</span>
            {rightStatus === 'streaming' && <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />}
          </div>
          {rightReasoning && (
            <div className="mb-3 p-3 rounded-lg bg-purple-500/[0.04] border border-purple-500/10">
              <span className="text-[10px] text-purple-400/70 block mb-1">思考过程</span>
              <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{rightReasoning}</p>
            </div>
          )}
          <div className="text-sm text-white/80 leading-relaxed">
            <MarkdownRenderer content={rightContent || '等待中...'} />
          </div>
        </div>
      </div>
    </div>
  );
}
