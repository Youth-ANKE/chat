import { X, Sun, Moon, Zap, Brain, Thermometer, Cpu, Sparkles, Globe, Sliders, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';
import { MODEL_OPTIONS } from '../types';
import { cn } from '../lib/utils';
import { playSave } from '../lib/sound';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const TOKEN_OPTIONS = [1024, 2048, 4096, 8192, 16384];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    settings,
    toggleDarkMode,
    toggleSoundEnabled,
    setDefaultModel,
    setDefaultTemperature,
    setDefaultThinking,
    setContextLimit,
    setTopP,
    setMaxTokens,
    setStreamOutput,
  } = useSettingsStore();

  const activeId = useChatStore((s) => s.activeId);
  const getActive = useChatStore((s) => s.getActive);
  const setSystemPrompt = useChatStore((s) => s.setSystemPrompt);
  const setModel = useChatStore((s) => s.setModel);
  const setThinking = useChatStore((s) => s.setThinking);
  const setTemperature = useChatStore((s) => s.setTemperature);
  const setSessionTopP = useChatStore((s) => s.setTopP);
  const setSessionMaxTokens = useChatStore((s) => s.setMaxTokens);
  const session = getActive();
  const darkMode = settings.darkMode;

  // Local values for per-session overrides
  const [localPrompt, setLocalPrompt] = useState(session?.systemPrompt ?? '');

  // Use session-level or global-level values
  const currentTemp = session?.temperature ?? settings.defaultTemperature;
  const currentTopP = session?.topP ?? settings.topP;
  const currentMaxTokens = session?.maxTokens ?? settings.maxTokens;

  useEffect(() => {
    if (session) {
      setLocalPrompt(session.systemPrompt ?? '');
    }
  }, [session?.id]);

  if (!open) return null;

  const handlePromptSave = () => {
    if (activeId) {
      setSystemPrompt(activeId, localPrompt);
      playSave();
      const btn = document.activeElement as HTMLElement;
      if (btn) {
        btn.textContent = '已应用 ✓';
        setTimeout(() => { btn.textContent = '应用提示词'; }, 1500);
      }
    }
  };

  /** Reset a setting back to default for this session */
  const resetContextLimit = () => { setContextLimit(0); };
  const resetTemp = () => { setDefaultTemperature(0.7); if (activeId) setTemperature(activeId, 0.7); };
  const resetTopP = () => { setTopP(1.0); if (activeId) setSessionTopP(activeId, 1.0); };
  const resetMaxTokens = () => { setMaxTokens(4096); if (activeId) setSessionMaxTokens(activeId, 4096); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Animated backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'relative h-full w-[380px] max-w-[90vw] animate-slide-in-right overflow-y-auto custom-scrollbar border-l',
        darkMode
          ? 'glass-heavy border-cyan-500/10 shadow-[0_0_60px_rgba(0,229,255,0.06)]'
          : 'bg-white border-gray-200 shadow-[-4px_0_24px_rgba(0,0,0,0.08)]'
      )}>
        {/* Header with glow line */}
        <div className="sticky top-0 z-10">
          {darkMode && <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />}
          <div className={cn(
            'flex items-center justify-between px-5 py-4 border-b',
            darkMode
              ? 'glass border-white/5'
              : 'bg-white/95 backdrop-blur border-gray-200'
          )}>
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'w-1.5 h-1.5 rounded-full',
                darkMode
                  ? 'bg-purple-400 shadow-[0_0_8px_rgba(179,102,255,0.6)]'
                  : 'bg-indigo-500'
              )} />
              <h2 className={cn(
                'text-base font-semibold tracking-wide',
                darkMode ? 'text-white/90' : 'text-gray-800'
              )}>对话设置</h2>
            </div>
            <button onClick={onClose} className={cn(
              'p-1.5 rounded-lg transition-all hover:rotate-90 duration-200',
              darkMode
                ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-700'
            )}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-7">
          {/* ── 特定模型设置 (Per-session model params) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className={cn(
                'text-[10px] font-semibold uppercase tracking-widest flex items-center gap-1.5',
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                <Sliders className="w-3 h-3" /> 特定模型设置
              </h3>
              <button
                onClick={resetContextLimit}
                disabled={settings.contextLimit === 0}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  settings.contextLimit === 0
                    ? 'text-gray-600 cursor-default'
                    : darkMode
                      ? 'text-cyan-400/70 hover:bg-white/[0.06]'
                      : 'text-blue-500 hover:bg-blue-50'
                }`}
                title="重置为不限制"
              >
                重置
              </button>
            </div>

            <div className={cn(
              'rounded-xl border p-4 space-y-5',
              darkMode
                ? 'border-white/[0.05] bg-gradient-to-br from-cyan-500/[0.02] to-purple-500/[0.02]'
                : 'border-gray-200 bg-gray-50/50'
            )}>

              {/* Context Limit */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={cn('text-xs', darkMode ? 'text-white/65' : 'text-gray-600')}>上下文消息数量上限</span>
                  <span className={cn(
                    'w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center cursor-help',
                    darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-500'
                  )} title="限制发送给模型的历史消息条数（0=不限制）">?</span>
                  <span className={cn(
                    'ml-auto text-[11px] font-mono tabular-nums',
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  )}>
                    {settings.contextLimit === 0 ? '不限制' : `${settings.contextLimit} 条`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={settings.contextLimit || 0}
                  onChange={(e) => setContextLimit(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,229,255,0.4)] [&::-webkit-slider-thumb]:cursor-pointer transition-all"
                  style={{
                    background: `linear-gradient(90deg, #4488ff 0%, #00e5ff ${settings.contextLimit > 0 ? Math.min(settings.contextLimit * 1, 100) : 0}%, ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} ${settings.contextLimit > 0 ? Math.min(settings.contextLimit * 1, 100) : 0}%, ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} 100%)`,
                  }}
                />
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={cn('text-xs', darkMode ? 'text-white/65' : 'text-gray-600')}>温度</span>
                  <span className={cn(
                    'w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center cursor-help',
                    darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-500'
                  )} title="控制输出的随机性，值越高越有创造性">?</span>
                  <span className={cn(
                    'ml-auto text-[11px] font-mono tabular-nums',
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  )}>
                    {currentTemp.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={currentTemp}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setDefaultTemperature(v);
                    if (activeId) setTemperature(activeId, v);
                  }}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,229,255,0.4)] [&::-webkit-slider-thumb]:cursor-pointer transition-all"
                  style={{
                    background: `linear-gradient(90deg, #4488ff 0%, #00e5ff ${currentTemp * 50}%, ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} ${currentTemp * 50}%, ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} 100%)`,
                  }}
                />
              </div>

              {/* Top P */}
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <span className={cn('text-xs', darkMode ? 'text-white/65' : 'text-gray-600')}>Top P</span>
                  <span className={cn(
                    'w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center cursor-help',
                    darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-500'
                  )} title="核采样参数，与 Temperature 二选一使用。1.0=不启用">?</span>
                  <span className={cn(
                    'ml-auto text-[11px] font-mono tabular-nums',
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  )}>
                    {currentTopP.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={currentTopP}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setTopP(v);
                    if (activeId) setSessionTopP(activeId, v);
                  }}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(168,85,247,0.4)] [&::-webkit-slider-thumb]:cursor-pointer transition-all"
                  style={{
                    background: `linear-gradient(90deg, #a855f7 0%, #c084fc ${currentTopP * 100}%, ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} ${currentTopP * 100}%, ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'} 100%)`,
                  }}
                />
              </div>

              {/* Max Tokens - Preset options + Custom input */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={cn('text-xs', darkMode ? 'text-white/65' : 'text-gray-600')}>最大输出 Token 数</span>
                  <span className={cn(
                    'w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center cursor-help',
                    darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-500'
                  )} title="单次回复的最大 Token 上限">?</span>
                  {currentMaxTokens !== settings.maxTokens && (
                    <span className="ml-auto text-[10px] font-mono tabular-nums text-purple-400">
                      会话: {currentMaxTokens.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Token option chips */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {TOKEN_OPTIONS.map((v) => {
                    const isActive = currentMaxTokens === v;
                    return (
                      <button
                        key={v}
                        onClick={() => {
                          setMaxTokens(v);
                          if (activeId) setSessionMaxTokens(activeId, v);
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-150 border',
                          isActive
                            ? darkMode
                              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                              : 'bg-purple-100 border-purple-300 text-purple-700'
                            : darkMode
                              ? 'bg-white/[0.03] border-white/[0.08] text-gray-500 hover:border-white/[0.15] hover:text-gray-300'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        )}
                      >
                        {v.toLocaleString()}
                      </button>
                    );
                  })}
                  {/* Custom option */}
                  <button
                    onClick={() => {
                      const custom = prompt('请输入自定义最大 Token 数 (256 ~ 32768):', String(currentMaxTokens));
                      if (custom === null) return;
                      const v = parseInt(custom, 10);
                      if (!isNaN(v) && v >= 256 && v <= 32768) {
                        setMaxTokens(v);
                        if (activeId) setSessionMaxTokens(activeId, v);
                      } else {
                        alert('请输入 256 ~ 32768 之间的整数');
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-mono transition-all duration-150 border',
                      !TOKEN_OPTIONS.includes(currentMaxTokens)
                        ? darkMode
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
                          : 'bg-cyan-50 border-cyan-300 text-cyan-700'
                        : darkMode
                          ? 'bg-white/[0.03] border-dashed border-white/[0.12] text-gray-500 hover:border-cyan-500/30 hover:text-cyan-400'
                          : 'bg-gray-50 border-dashed border-gray-200 text-gray-500 hover:border-cyan-300 hover:text-cyan-600'
                    )}
                  >
                    {!TOKEN_OPTIONS.includes(currentMaxTokens)
                      ? `${currentMaxTokens.toLocaleString()} ✎`
                      : '自定义 ✎'}
                  </button>
                </div>

                {/* Current value display */}
                <div className={cn(
                  'text-center text-[11px] font-mono py-1 rounded-md',
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                )}>
                  当前值: <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>{currentMaxTokens.toLocaleString()}</span> tokens
                </div>
              </div>

              {/* Stream Output Toggle */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs', darkMode ? 'text-white/65' : 'text-gray-600')}>流式输出</span>
                  <span className={cn(
                    'w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center cursor-help',
                    darkMode ? 'bg-white/10 text-gray-500' : 'bg-gray-200 text-gray-500'
                  )} title="开启后逐 token 显示回复内容；关闭则等待完整回复后一次性显示">?</span>
                </div>
                <button
                  onClick={() => setStreamOutput(!settings.streamOutput)}
                  className={`relative inline-flex h-[22px] w-10 items-center rounded-full transition-colors duration-200 focus:outline-none ${
                    settings.streamOutput ? 'bg-emerald-500' : darkMode ? 'bg-white/15' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                      settings.streamOutput ? 'translate-x-[22px]' : 'translate-x-[2px]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* ── Status Card ── */}
          <section>
            <h3 className={cn(
              'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Cpu className="w-3 h-3" /> 状态
            </h3>
            <div className={cn(
              'rounded-xl border p-4 space-y-2',
              darkMode
                ? 'border-white/[0.05] bg-gradient-to-br from-cyan-500/[0.03] to-purple-500/[0.03]'
                : 'border-gray-200 bg-gray-50/50'
            )}>
              <div className="flex items-center justify-between">
                <span className={cn('text-xs', darkMode ? 'text-white/50' : 'text-gray-500')}>当前模型</span>
                <span className={cn(
                  'text-sm font-mono font-bold',
                  session?.model === 'deepseek-v4-pro'
                    ? darkMode ? 'text-purple-400' : 'text-purple-600'
                    : darkMode ? 'text-cyan-400' : 'text-cyan-600'
                )}>
                  {session?.model === 'deepseek-v4-pro' ? 'V4 Pro' : 'V4 Flash'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-xs', darkMode ? 'text-white/50' : 'text-gray-500')}>深度思考</span>
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  session?.thinking
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : darkMode ? 'bg-white/[0.04] text-gray-500' : 'bg-gray-100 text-gray-500'
                )}>
                  {session?.thinking ? '已启用' : '关闭'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-xs', darkMode ? 'text-white/50' : 'text-gray-500')}>联网搜索</span>
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  session?.webSearch
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : darkMode ? 'bg-white/[0.04] text-gray-500' : 'bg-gray-100 text-gray-500'
                )}>
                  {session?.webSearch ? '已启用' : '关闭'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-xs', darkMode ? 'text-white/50' : 'text-gray-500')}>上下文上限</span>
                <span className={cn(
                  'text-xs font-mono',
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                )}>
                  {settings.contextLimit === 0 ? '不限' : `${settings.contextLimit}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-xs', darkMode ? 'text-white/50' : 'text-gray-500')}>最大输出</span>
                <span className={cn(
                  'text-xs font-mono',
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                )}>{currentMaxTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn('text-xs', darkMode ? 'text-white/50' : 'text-gray-500')}>流式输出</span>
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  settings.streamOutput
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : darkMode ? 'bg-white/[0.04] text-gray-500' : 'bg-gray-100 text-gray-500'
                )}>
                  {settings.streamOutput ? '开启' : '关闭'}
                </span>
              </div>
            </div>
          </section>

          {/* ── Appearance / Theme ── */}
          <section>
            <h3 className={cn(
              'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
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
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className={cn(
                  'absolute -right-2 -top-2 w-16 h-16 rounded-full blur-xl',
                  darkMode ? 'bg-cyan-500/8' : 'bg-cyan-500/5'
                )} />
                <Moon className={cn(
                  'w-5 h-5 mb-2 transition-colors', darkMode ? 'text-cyan-400' : 'text-gray-500'
                )} />
                <div className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-white/80' : 'text-gray-700'
                )}>深空模式</div>
                <div className={cn(
                  'text-[11px] mt-0.5',
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                )}>赛博朋克 · 霓虹科技</div>
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
                    : darkMode
                      ? 'border-white/[0.06] hover:border-white/[0.12]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <Sun className={cn(
                  'w-5 h-5 mb-2 transition-colors',
                  !darkMode ? 'text-amber-500' : darkMode ? 'text-gray-600' : 'text-gray-500'
                )} />
                <div className={cn(
                  'text-sm font-medium',
                  darkMode ? 'text-white/70' : 'text-gray-700'
                )}>浅色模式</div>
                <div className={cn(
                  'text-[11px] mt-0.5',
                  darkMode ? 'text-gray-600' : 'text-gray-400'
                )}>简洁明亮 · 清爽风格</div>
                {!darkMode && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500" />
                )}
              </button>
            </div>
          </section>

          {/* ── Sound Effects ── */}
          <section>
            <h3 className={cn(
              'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Volume2 className="w-3 h-3" /> 音效
            </h3>
            <button
              onClick={toggleSoundEnabled}
              className={cn(
                'w-full rounded-xl border p-3.5 flex items-center gap-3 text-left transition-all duration-300',
                settings.soundEnabled
                  ? darkMode
                    ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/[0.06] to-emerald-500/[0.04] shadow-[0_0_12px_rgba(0,229,255,0.06)]'
                    : 'border-indigo-300 bg-indigo-50'
                  : darkMode
                    ? 'border-white/[0.06] hover:border-white/[0.12]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                settings.soundEnabled
                  ? darkMode ? 'bg-cyan-500/15' : 'bg-indigo-100'
                  : darkMode ? 'bg-white/[0.04]' : 'bg-gray-100'
              )}>
                {settings.soundEnabled ? (
                  <Volume2 className={cn('w-5 h-5', darkMode ? 'text-cyan-400' : 'text-indigo-600')} />
                ) : (
                  <VolumeX className={cn('w-5 h-5', darkMode ? 'text-gray-600' : 'text-gray-400')} />
                )}
              </div>
              <div className="flex-1">
                <div className={cn('text-sm font-medium', darkMode ? 'text-white/80' : 'text-gray-700')}>
                  {settings.soundEnabled ? '音效已开启' : '音效已关闭'}
                </div>
                <div className={cn('text-[11px] mt-0.5', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                  切换、保存等操作的反馈音效
                </div>
              </div>
              {settings.soundEnabled && (
                <div className={cn('w-2 h-2 rounded-full', darkMode ? 'bg-emerald-400 shadow-[0_0_6px_rgba(0,255,136,0.6)]' : 'bg-indigo-500')} />
              )}
            </button>
          </section>

          {/* ── System Prompt ── */}
          {session && (
            <section>
              <h3 className={cn(
                'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
                darkMode ? 'text-gray-500' : 'text-gray-400'
              )}>
                <Zap className="w-3 h-3" /> 系统提示词
              </h3>
              <textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                placeholder="定义 AI 的角色和行为…&#10;&#10;示例：你是一位专业的技术架构师…"
                rows={4}
                className={cn(
                  'w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-all leading-relaxed',
                  darkMode
                    ? 'bg-white/[0.03] border-white/[0.06] focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 text-white/80 placeholder-gray-600'
                    : 'bg-gray-100 border-gray-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300/30 text-gray-800 placeholder-gray-400'
                )}
              />
              <button
                onClick={handlePromptSave}
                className={cn(
                  'mt-2.5 w-full px-3 py-2 rounded-lg text-xs transition-all font-medium border',
                  darkMode
                    ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-400/90 hover:from-cyan-500/20 hover:to-purple-500/20 border-cyan-500/10 hover:border-cyan-500/25'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200'
                )}
              >
                应用提示词
              </button>
            </section>
          )}

          {/* ── Model Selection ── */}
          <section>
            <h3 className={cn(
              'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
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
                      ? darkMode
                        ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/[0.06] to-purple-500/[0.03] shadow-[0_0_12px_rgba(0,229,255,0.06)]'
                        : 'border-indigo-300 bg-indigo-50'
                      : darkMode
                        ? 'border-white/[0.05] hover:border-white/[0.10] hover:bg-white/[0.02]'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                      (session?.model ?? settings.defaultModel) === opt.value
                        ? opt.value === 'deepseek-v4-pro'
                          ? darkMode ? 'bg-purple-500/15' : 'bg-purple-100'
                          : darkMode ? 'bg-cyan-500/15' : 'bg-cyan-100'
                        : darkMode ? 'bg-white/[0.04]' : 'bg-gray-100'
                    )}>
                      <Zap className={cn(
                        'w-4 h-4',
                        (session?.model ?? settings.defaultModel) === opt.value
                          ? opt.value === 'deepseek-v4-pro'
                            ? darkMode ? 'text-purple-400' : 'text-purple-600'
                            : darkMode ? 'text-cyan-400' : 'text-cyan-600'
                          : darkMode ? 'text-gray-500' : 'text-gray-400'
                      )} />
                    </div>
                    <div>
                      <div className={cn(
                        'text-sm font-medium',
                        (session?.model ?? settings.defaultModel) === opt.value
                          ? darkMode ? 'text-white/90' : 'text-gray-800'
                          : darkMode ? 'text-white/65' : 'text-gray-600'
                      )}>{opt.label}</div>
                      <div className={cn(
                        'text-xs mt-0.5',
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      )}>{opt.desc}</div>
                    </div>
                  </div>
                  {(session?.model ?? settings.defaultModel) === opt.value && (
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      darkMode ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]' : 'bg-indigo-500'
                    )} />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* ── Deep Thinking Toggle ── */}
          <section>
            <h3 className={cn(
              'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Brain className="w-3 h-3" /> 深度推理
            </h3>
            <label className={cn(
              'flex items-start gap-3.5 px-4 py-3.5 rounded-xl border cursor-pointer transition-all duration-200',
              session?.thinking ?? settings.defaultThinking
                ? darkMode
                  ? 'border-purple-500/25 bg-purple-500/[0.04] shadow-[0_0_12px_rgba(179,102,255,0.04)]'
                  : 'border-purple-300 bg-purple-50'
                : darkMode
                  ? 'border-white/[0.05] hover:border-purple-500/15 hover:bg-white/[0.01]'
                  : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
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
                <div className={cn(
                  'text-sm font-medium flex items-center gap-2',
                  darkMode ? 'text-white/85' : 'text-gray-800'
                )}>
                  <Brain className={cn('w-4 h-4', darkMode ? 'text-purple-400' : 'text-purple-600')} />
                  启用深度思考（Chain-of-Thought）
                </div>
                <p className="text-xs mt-1.5 leading-relaxed text-gray-500">
                  开启后，DeepSeek 会先进行内部推理链分析再输出回答。适合复杂逻辑推理、数学计算、代码调试等场景。响应时间会增加。
                </p>
                {(session?.thinking ?? settings.defaultThinking) && (
                  <div className={cn(
                    'mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px]',
                    darkMode
                      ? 'bg-purple-500/10 text-purple-400/80'
                      : 'bg-purple-100 text-purple-600'
                  )}>
                    <div className={cn(
                      'w-1.5 h-1.5 rounded-full animate-pulse',
                      darkMode
                        ? 'bg-purple-400 shadow-[0_0_4px_rgba(179,102,255,0.6)]'
                        : 'bg-purple-500'
                    )} />
                    思考过程将可视化展示
                  </div>
                )}
              </div>
            </label>
          </section>

          {/* Footer info */}
          <div className={cn(
            'pt-4 border-t',
            darkMode ? 'border-white/[0.04]' : 'border-gray-200'
          )}>
            <div className={cn(
              'flex items-center justify-center gap-1.5 text-[11px]',
              darkMode ? 'text-gray-600' : 'text-gray-400'
            )}>
              <div className={cn(
                'w-1 h-1 rounded-full',
                darkMode ? 'bg-emerald-500/40' : 'bg-emerald-500'
              )} />
              DeepSeek Chatbox · AI Terminal v2.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
