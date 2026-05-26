import { X, Zap, Cpu, Globe, Palette, Code, Layers } from 'lucide-react';
import { useEffect } from 'react';

interface AboutPanelProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  { Icon: Zap, label: '流式对话', desc: '实时 Token 级流式输出' },
  { Icon: Cpu, label: '深度推理', desc: '可视化思考链展示' },
  { Icon: Globe, label: '联网搜索', desc: '支持 Web Search' },
  { Icon: Code, label: 'Artifacts', desc: '代码预览与运行' },
  { Icon: Layers, label: '多功能', desc: '知识库 · 标签 · 分叉 · 分享' },
  { Icon: Palette, label: '双主题', desc: '深空模式 / 浅色模式' },
];

export function AboutPanel({ open, onClose }: AboutPanelProps) {
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
      <div className="relative w-full max-w-md mx-4 glass-heavy rounded-2xl border border-purple-500/20 shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
            <h2 className="text-base font-semibold text-white/90">关于 DeepSeek Chatbox</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Logo & Version */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white/90">DeepSeek Chatbox</h1>
            <span className="text-xs text-cyan-400/70 font-mono mt-0.5">v3.0</span>
            <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
              新一代 AI 对话终端 · 深空科技 · 思考可视化 · 流式对话
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map(({ Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
              >
                <Icon className="w-4 h-4 text-cyan-400/80 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-medium text-gray-200 block">{label}</span>
                  <span className="text-[10px] text-gray-500 block">{desc}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tech stack */}
          <div className="mt-5 pt-4 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-500 font-mono">
                React 18
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-500 font-mono">
                TypeScript
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-500 font-mono">
                Vite
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-500 font-mono">
                Tailwind CSS
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-500 font-mono">
                Zustand
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] text-gray-500 font-mono">
                Lucide Icons
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-[10px] text-gray-600 text-center">
            Built with ❤️ · Powered by DeepSeek API
          </p>
        </div>
      </div>
    </div>
  );
}
