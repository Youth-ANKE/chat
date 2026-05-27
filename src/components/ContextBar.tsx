import { useMemo } from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface ContextBarProps {
  totalTokens: number;
  maxTokens: number;
  contextLimit: number;
  messageCount: number;
}

function estimateMsgTokens(content: string): number {
  return Math.ceil(content.length / 2.5);
}

export function ContextBar({ totalTokens, maxTokens, contextLimit, messageCount }: ContextBarProps) {
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const showContextBar = useSettingsStore((s) => s.settings.showContextBar);

  const effectiveLimit = contextLimit > 0 ? contextLimit : 40;
  const percentage = Math.min(100, (messageCount / effectiveLimit) * 100);
  const tokenPct = Math.min(100, (totalTokens / (maxTokens * 3)) * 100); // rough estimation: 3 messages ~ maxTokens

  // Color based on usage
  const getColor = (pct: number) => {
    if (pct > 85) return darkMode ? 'bg-red-500' : 'bg-red-500';
    if (pct > 60) return darkMode ? 'bg-amber-500' : 'bg-amber-500';
    return darkMode ? 'bg-emerald-500' : 'bg-emerald-500';
  };

  const getBg = () => darkMode ? 'bg-white/[0.04]' : 'bg-gray-200';

  if (!showContextBar || messageCount < 2) return null;

  return (
    <div className={`px-4 py-1.5 border-b z-10 ${
      darkMode ? 'backdrop-blur-[40px] saturate-[200%] brightness-[1.03] bg-white/[0.02] border-b border-white/[0.05]' : 'backdrop-blur-[40px] saturate-[190%] brightness-[1.04] bg-white/[0.30] border-b border-gray-200/20'
    }`}>
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[10px] font-mono ${darkMode ? 'text-white/20' : 'text-gray-400'}`}>
              上下文窗口
            </span>
            <span className={`text-[10px] font-mono tabular-nums ${
              percentage > 85
                ? darkMode ? 'text-red-400' : 'text-red-500'
                : darkMode ? 'text-white/25' : 'text-gray-400'
            }`}>
              {messageCount}/{effectiveLimit} 条 · ≈{totalTokens.toLocaleString()} tokens
              {percentage > 85 && ' ⚠'}
            </span>
          </div>
          <div className={`h-1 rounded-full overflow-hidden ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${getColor(percentage)}`}
              style={{ width: `${percentage}%`, opacity: 0.6 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
