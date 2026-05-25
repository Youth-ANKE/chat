import { X, Sun, Moon, Zap, Brain, Thermometer, Cpu, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';
import { MODEL_OPTIONS } from '../types';
import { cn } from '../lib/utils';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, toggleDarkMode, setDefaultModel, setDefaultTemperature, setDefaultThinking } =
    useSettingsStore();

  const activeId = useChatStore((s) => s.activeId);
  const getActive = useChatStore((s) => s.getActive);
  const setSystemPrompt = useChatStore((s) => s.setSystemPrompt);
  const setModel = useChatStore((s) => s.setModel);
  const setThinking = useChatStore((s) => s.setThinking);
  const setTemperature = useChatStore((s) => s.setTemperature);
  const session = getActive();
  const darkMode = settings.darkMode;

  const [localPrompt, setLocalPrompt] = useState(session?.systemPrompt ?? '');

  useEffect(() => {
    if (session) {
      setLocalPrompt(session.systemPrompt ?? '');
    }
  }, [session?.id]);

  if (!open) return null;

  const handlePromptSave = () => {
    if (activeId) {
      setSystemPrompt(activeId, localPrompt);
      // Visual feedback
      const btn = document.activeElement as HTMLElement;
      if (btn) {
        btn.textContent = '已应用 ✓';
        setTimeout(() => { btn.textContent = '应用提示词'; }, 1500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Animated backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative h-full w-[340px] max-w-[90vw] glass-heavy border-l border-cyan-500/10 shadow-[0_0_60px_rgba(0,229,255,0.06)] animate-slide-in-right overflow-y-auto custom-scrollbar">
        {/* Header with glow line */}
        <div className="sticky top-0 z-10">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          <div className="flex items-center justify-between px-5 py-4 glass border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(179,102,255,0.6)]" />
              <h2 className="text-base font-semibold text-white/90 tracking-wide">系统设置</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all hover:rotate-90 duration-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-7">
          {/* ── Status Card ── */}
          <section>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Cpu className="w-3 h-3" /> 状态
            </h3>
            <div className="rounded-xl border border-white/[0.05] p-4 bg-gradient-to-br from-cyan-500/[0.03] to-purple-500/[0.03]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">当前模型</span>
                <span className={`text-sm font-mono font-bold ${
                  session?.model === 'deepseek-v4-pro' ? 'text-purple-400' : 'text-cyan-400'
                }`}>
                  {session?.model === 'deepseek-v4-pro' ? 'V4 Pro' : 'V4 Flash'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">深度思考</span>
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  session?.thinking
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-white/[0.04] text-gray-500'
                )}>
                  {session?.thinking ? '已启用' : '关闭'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Temperature</span>
                <span className="text-sm font-mono text-blue-400">{(session?.temperature ?? 0.7).toFixed(1)}</span>
              </div>
            </div>
          </section>

          {/* ── Appearance / Theme ── */}
          <section>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> 外观主题
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Dark mode card */}
              <button
                onClick={() => !darkMode && toggleDarkMode()}
                disabled={darkMode}
                className={cn(
                  'relative group rounded-xl border p-3.5 text-left transition-all duration-300 overflow-hidden',
                  darkMode
                    ? 'border-cyan-500/30 bg-gradient-to-b from-cyan-500/[0.08] to-purple-500/[0.04] shadow-[0_0_12px_rgba(0,229,255,0.08)]'
                    : 'border-white/[0.06] hover:border-white/[0.12]'
                )}
              >
                <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-cyan-500/8 blur-xl" />
                <Moon className={cn(
                  'w-5 h-5 mb-2 transition-colors', darkMode ? 'text-cyan-400' : 'text-gray-500'
                )} />
                <div className="text-sm font-medium text-white/80">深空模式</div>
                <div className="text-[11px] mt-0.5 text-gray-500">赛博朋克 · 霓虹科技</div>
                {darkMode && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(0,229,255,0.7)]" />
                )}
              </button>

              {/* Light mode card */}
              <button
                onClick={() => darkMode && toggleDarkMode()}
                disabled={!darkMode}
                className={cn(
                  'relative group rounded-xl border p-3.5 text-left transition-all duration-300 overflow-hidden',
                  !darkMode
                    ? 'border-indigo-300 bg-indigo-50'
                    : 'border-white/[0.06] hover:border-white/[0.12]'
                )}
              >
                <Sun className={cn(
                  'w-5 h-5 mb-2 transition-colors',
                  !darkMode ? 'text-amber-500' : 'text-gray-600'
                )} />
                <div className="text-sm font-medium text-white/70">浅色模式</div>
                <div className="text-[11px] mt-0.5 text-gray-600">简洁明亮 · 清爽风格</div>
                {!darkMode && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </button>
            </div>
          </section>

          {/* ── System Prompt ── */}
          {session && (
            <section>
              <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> 系统提示词
              </h3>
              <textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="定义 AI 的角色和行为…&#10;&#10;示例：你是一位专业的技术架构师…"
                rows={4}
                className="w-full resize-none rounded-xl bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 px-3.5 py-2.5 text-sm text-white/80 placeholder-gray-600 outline-none transition-all leading-relaxed"
              />
              <button
                onClick={handlePromptSave}
                className="mt-2.5 w-full px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400/90 text-xs hover:from-cyan-500/20 hover:to-purple-500/20 border border-cyan-500/10 hover:border-cyan-500/25 transition-all font-medium"
              >
                应用提示词
              </button>
            </section>
          )}

          {/* ── Model Selection ── */}
          <section>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Zap className="w-3 h-3" /> 模型选择
            </h3>
            <div className="space-y-2.5">
              {MODEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDefaultModel(opt.value);
                    if (activeId) setModel(activeId, opt.value);
                  }}
                  className={cn(
                    'group flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all duration-200 text-left',
                    (session?.model ?? settings.defaultModel) === opt.value
                      ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/[0.06] to-purple-500/[0.03] shadow-[0_0_12px_rgba(0,229,255,0.06)]'
                      : 'border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                      (session?.model ?? settings.defaultModel) === opt.value
                        ? opt.value === 'deepseek-v4-pro'
                          ? 'bg-purple-500/15'
                          : 'bg-cyan-500/15'
                        : 'bg-white/[0.04]'
                    )}>
                      <Zap className={cn(
                        'w-4 h-4',
                        (session?.model ?? settings.defaultModel) === opt.value
                          ? opt.value === 'deepseek-v4-pro' ? 'text-purple-400' : 'text-cyan-400'
                          : 'text-gray-500'
                      )} />
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${
                        (session?.model ?? settings.defaultModel) === opt.value ? 'text-white/90' : 'text-white/65'
                      }`}>{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                  {(session?.model ?? settings.defaultModel) === opt.value && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Temperature Slider ── */}
          <section>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Thermometer className="w-3 h-3" /> Temperature
            </h3>
            <div className="px-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-gray-500">精确</span>
                <span className="text-base font-bold tabular-nums font-mono bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {(session?.temperature ?? settings.defaultTemperature).toFixed(1)}
                </span>
                <span className="text-[11px] text-gray-500">创造性</span>
              </div>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={session?.temperature ?? settings.defaultTemperature}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setDefaultTemperature(v);
                  if (activeId) setTemperature(activeId, v);
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,229,255,0.4)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb:hover]:shadow-[0_0_14px_rgba(0,229,255,0.6)]"
                style={{
                  background: `linear-gradient(90deg, #4488ff 0%, #00e5ff ${(session?.temperature ?? settings.defaultTemperature) * 50}%, rgba(255,255,255,0.06) ${(session?.temperature ?? settings.defaultTemperature) * 50}%, rgba(255,255,255,0.06) 100%)`,
                }}
              />
            </div>
          </section>

          {/* ── Deep Thinking Toggle ── */}
          <section>
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> 深度推理
            </h3>
            <label className={cn(
              'flex items-start gap-3.5 px-4 py-3.5 rounded-xl border cursor-pointer transition-all duration-200',
              session?.thinking ?? settings.defaultThinking
                ? 'border-purple-500/25 bg-purple-500/[0.04] shadow-[0_0_12px_rgba(179,102,255,0.04)]'
                : 'border-white/[0.05] hover:border-purple-500/15 hover:bg-white/[0.01]'
            )}>
              <input
                type="checkbox"
                checked={session?.thinking ?? settings.defaultThinking}
                onChange={(e) => {
                  setDefaultThinking(e.target.checked);
                  if (activeId) setThinking(activeId, e.target.checked);
                }}
                className="w-4 h-4 mt-0.5 rounded accent-purple-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-white/85 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  启用深度思考（Chain-of-Thought）
                </div>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  开启后，DeepSeek 会先进行内部推理链分析再输出回答。适合复杂逻辑推理、数学计算、代码调试等场景。响应时间会增加。
                </p>
                {(session?.thinking ?? settings.defaultThinking) && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 text-[11px] text-purple-400/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_4px_rgba(179,102,255,0.6)] animate-pulse" />
                    思考过程将可视化展示
                  </div>
                )}
              </div>
            </label>
          </section>

          {/* Footer info */}
          <div className="pt-4 border-t border-white/[0.04]">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-600">
              <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
              DeepSeek Chatbox · AI Terminal v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
