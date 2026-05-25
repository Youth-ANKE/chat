import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ShortcutHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['Ctrl', 'N'], label: '新建对话' },
  { keys: ['Ctrl', 'E'], label: '聚焦输入框' },
  { keys: ['Ctrl', 'Shift', 'E'], label: '导出当前对话' },
  { keys: ['Ctrl', 'K'], label: '清空当前对话' },
  { keys: ['Ctrl', 'F'], label: '搜索对话内容' },
  { keys: ['Ctrl', 'P'], label: '打开提示词库' },
  { keys: ['Ctrl', 'B'], label: '切换侧栏' },
  { keys: ['Ctrl', '/'], label: '显示/隐藏快捷键' },
  { keys: ['Enter'], label: '发送消息' },
  { keys: ['Shift', 'Enter'], label: '消息换行' },
  { keys: ['Escape'], label: '关闭面板/取消搜索' },
];

export function ShortcutHelp({ open, onClose }: ShortcutHelpProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md mx-4 glass-heavy rounded-2xl border border-cyan-500/20 shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
            <h2 className="text-base font-semibold text-white/90">键盘快捷键</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 space-y-1 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-sm text-gray-300">{item.label}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((k, i) => (
                  <span key={i}>
                    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-md bg-white/[0.06] border border-white/10 text-xs text-cyan-400 font-mono">
                      {k}
                    </kbd>
                    {i < item.keys.length - 1 && (
                      <span className="text-gray-600 mx-0.5 text-xs">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-xs text-gray-500">
            按 <kbd className="px-1 py-0.5 rounded bg-white/5 text-cyan-400 text-[11px]">Ctrl + /</kbd> 随时呼出此面板
          </p>
        </div>
      </div>
    </div>
  );
}
