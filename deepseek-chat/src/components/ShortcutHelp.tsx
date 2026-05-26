import { X, Search, Download, FileJson, Share2, Database, BarChart3, Headphones, Music, Settings, HelpCircle, Info } from 'lucide-react';
import { useEffect } from 'react';

interface ShortcutHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['Ctrl', 'N'], label: '新建对话' },
  { keys: ['Ctrl', 'E'], label: '聚焦输入框' },
  { keys: ['Ctrl', 'Shift', 'E'], label: '导出 Markdown' },
  { keys: ['Ctrl', 'Shift', 'F'], label: '全局搜索' },
  { keys: ['Ctrl', 'K'], label: '清空当前对话' },
  { keys: ['Ctrl', 'F'], label: '搜索对话内容' },
  { keys: ['Ctrl', 'P'], label: '打开提示词库' },
  { keys: ['Ctrl', 'B'], label: '切换侧栏' },
  { keys: ['Ctrl', '/'], label: '显示/隐藏帮助' },
  { keys: ['Enter'], label: '发送消息' },
  { keys: ['Shift', 'Enter'], label: '消息换行' },
  { keys: ['Escape'], label: '关闭面板/取消搜索' },
];

const TOOLBAR_ICONS: { Icon: React.ComponentType<{ className?: string }>; label: string; desc: string }[] = [
  { Icon: Search, label: '搜索', desc: '全局搜索所有对话 (Ctrl+Shift+F)' },
  { Icon: Download, label: '导出 MD', desc: '导出当前对话为 Markdown 文件 (Ctrl+Shift+E)' },
  { Icon: FileJson, label: '导出 JSON', desc: '导出当前对话为 JSON 文件' },
  { Icon: Share2, label: '分享', desc: '将对话分享为图片或链接' },
  { Icon: Database, label: '知识库', desc: '上传文档建立知识库检索' },
  { Icon: BarChart3, label: '用量统计', desc: '查看 API 调用次数与费用' },
  { Icon: Headphones, label: '朗读', desc: '使用 TTS 朗读 AI 回复' },
  { Icon: Music, label: '背景音乐', desc: '播放背景白噪音' },
  { Icon: Info, label: '关于', desc: '应用版本与功能介绍' },
  { Icon: HelpCircle, label: '帮助', desc: '查看快捷键与功能说明' },
  { Icon: Settings, label: '设置', desc: '模型参数、主题、音效等' },
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
      <div className="relative w-full max-w-lg mx-4 glass-heavy rounded-2xl border border-cyan-500/20 shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.5)]" />
            <h2 className="text-base font-semibold text-white/90">帮助 · 快捷键与功能</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[65vh] overflow-y-auto">
          {/* Keyboard shortcuts */}
          <div className="p-4">
            <h3 className="text-xs font-semibold text-cyan-400/70 uppercase tracking-wider mb-2 px-1">⌨ 键盘快捷键</h3>
            <div className="space-y-0.5">
              {SHORTCUTS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
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
          </div>

          {/* Toolbar icons */}
          <div className="p-4 pt-0">
            <h3 className="text-xs font-semibold text-purple-400/70 uppercase tracking-wider mb-2 px-1">🔧 工具栏功能图标</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {TOOLBAR_ICONS.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                >
                  <item.Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs text-gray-200 block truncate">{item.label}</span>
                    <span className="text-[10px] text-gray-500 block truncate">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-xs text-gray-500">
            按 <kbd className="px-1 py-0.5 rounded bg-white/5 text-cyan-400 text-[11px]">Ctrl + /</kbd> 或点击顶部 <span className="text-cyan-400">?</span> 随时呼出此面板
          </p>
        </div>
      </div>
    </div>
  );
}
