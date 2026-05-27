import { X, Sun, Moon, Zap, Brain, Cpu, Sparkles, Sliders, Volume2, VolumeX, Headphones, Play, Music, Star, Palette, Type, Clock, Download, Upload, RotateCcw, Globe, Bell, BellOff, Bot, Gauge, Mic, Server } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';
import { ACCENT_COLORS } from '../types';
import { getAllModels, getModelById } from '../lib/provider-adapter';
import { cn } from '../lib/utils';
import { playClick, playToggleOn, playToggleOff, playSave } from '../lib/sound';
import { getAvailableVoices, previewVoice, AZURE_VOICES, MIMO_VOICES, type SpeechVoice } from '../lib/speech';
import { previewTrack, MUSIC_TRACKS, type MusicMode } from '../lib/music';
import { useProviderStore } from '../stores/providerStore';
import { ProviderManager } from './ProviderManager';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { useTranslation } from 'react-i18next';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

const TOKEN_OPTIONS = [1024, 2048, 4096, 8192, 16384];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { t, i18n } = useTranslation();
  const {
    settings,
    toggleDarkMode,
    toggleSoundEnabled,
    toggleSpeechEnabled,
    toggleMusicEnabled,
    setMusicMode,
    setMusicVolume,
    setSpeechVoice,
    toggleSpeechVoiceFavorite,
    setDefaultModel,
    setDefaultTemperature,
    setDefaultThinking,
    setContextLimit,
    setTopP,
    setMaxTokens,
    setStreamOutput,
    setAccentColor,
    setFontSize,
    setShowTimestamps,
    setNotificationsEnabled,
    setAutoTitleAI,
    setShowContextBar,
    setLanguage,
    setDefaultProviderId,
    setVoiceAutoSend,
    setShowArchived,
    exportSettings,
    importSettings,
    resetSettings,
  } = useSettingsStore();

  const { toast } = useToast();
  const { confirm } = useConfirm();

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

  // Available TTS voices (loaded asynchronously in Chrome)
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);
  useEffect(() => {
    const loadVoices = () => setVoices(getAvailableVoices());
    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

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
              : 'backdrop-blur-[45px] saturate-[190%] brightness-[1.05] bg-white/[0.40] border border-gray-200/20'
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
                onClick={() => {
                  if (settings.contextLimit === 0) return;
                  resetContextLimit();
                  playClick();
                }}
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
                  playClick();
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
                        playClick();
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
                  onClick={() => {
                    setStreamOutput(!settings.streamOutput);
                    if (settings.streamOutput) playToggleOff();
                    else playToggleOn();
                  }}


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
                  darkMode ? 'text-cyan-400' : 'text-cyan-600'
                )}>
                  {(() => {
                    const providers = useProviderStore.getState().providers;
                    const info = getModelById(session?.model ?? settings.defaultModel, providers);
                    return info?.model.name ?? session?.model ?? settings.defaultModel;
                  })()}
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
                onClick={() => { if (!darkMode) { toggleDarkMode(); } }}
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
                onClick={() => { if (darkMode) { toggleDarkMode(); } }}
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
              onClick={() => {
                toggleSoundEnabled();
                settings.soundEnabled ? playToggleOff() : playToggleOn();
              }}
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

          {/* ── Speech / TTS ── */}
          <section>
            <h3 className={cn(
              'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Headphones className="w-3 h-3" /> 朗读回答
            </h3>
            <button
              onClick={() => {
                toggleSpeechEnabled();
                settings.speechEnabled ? playToggleOff() : playToggleOn();
              }}
              className={cn(
                'w-full rounded-xl border p-3.5 flex items-center gap-3 text-left transition-all duration-300',
                settings.speechEnabled
                  ? darkMode
                    ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/[0.06] to-pink-500/[0.04] shadow-[0_0_12px_rgba(179,102,255,0.06)]'
                    : 'border-purple-300 bg-purple-50'
                  : darkMode
                    ? 'border-white/[0.06] hover:border-white/[0.12]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                settings.speechEnabled
                  ? darkMode ? 'bg-purple-500/15' : 'bg-purple-100'
                  : darkMode ? 'bg-white/[0.04]' : 'bg-gray-100'
              )}>
                <Headphones className={cn('w-5 h-5', darkMode ? 'text-purple-400' : 'text-purple-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-medium', darkMode ? 'text-white/80' : 'text-gray-700')}>
                  {settings.speechEnabled ? '朗读已开启' : '朗读已关闭'}
                </div>
                <div className={cn('text-[11px] mt-0.5', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                  流式输出时自动朗读 AI 回复
                </div>
              </div>
              {settings.speechEnabled && (
                <div className={cn('w-2 h-2 rounded-full', darkMode ? 'bg-purple-400 shadow-[0_0_6px_rgba(179,102,255,0.6)]' : 'bg-purple-500')} />
              )}
            </button>

            {/* Voice selector */}
            {settings.speechEnabled && voices.length > 0 && (
              <div className="mt-2.5 relative">
                <label className={cn(
                  'text-[11px] font-medium mb-1.5 block',
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                )}>
                  语音选择
                </label>
                <button
                  onClick={() => { playClick(); setVoiceDropdownOpen(!voiceDropdownOpen); }}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2 text-xs outline-none transition-all flex items-center justify-between',
                    darkMode
                      ? 'bg-white/[0.03] border-white/[0.08] text-white/75 hover:border-purple-500/30 focus:border-purple-500/30'
                      : 'bg-gray-100 border-gray-200 text-gray-700 hover:border-purple-300 focus:border-purple-300'
                  )}
                >
                  <span className="truncate pr-4">
                    {(settings.speechVoice && [...AZURE_VOICES, ...MIMO_VOICES, ...voices].find(v => v.voiceURI === settings.speechVoice))
                      ? `${[...AZURE_VOICES, ...MIMO_VOICES, ...voices].find(v => v.voiceURI === settings.speechVoice)!.name} (${[...AZURE_VOICES, ...MIMO_VOICES, ...voices].find(v => v.voiceURI === settings.speechVoice)!.lang})`
                      : '系统默认'}
                  </span>
                  <svg className="w-3 h-3 flex-shrink-0 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>

                {/* Dropdown popup */}
                {voiceDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setVoiceDropdownOpen(false)} />
                    <div className={cn(
                      'absolute left-0 right-0 top-full mt-1 rounded-lg border shadow-xl z-[61] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar',
                      darkMode ? 'bg-[#161825] border-white/[0.08]' : 'bg-white border-gray-200'
                    )}>
                      {/* 系统默认 */}
                      <div
                        onClick={() => { setSpeechVoice(''); setVoiceDropdownOpen(false); }}
                        className={cn(
                          'px-3 py-2 text-xs cursor-pointer truncate transition-colors flex items-center justify-between gap-2',
                          !settings.speechVoice
                            ? darkMode ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-600'
                            : darkMode ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white/70' : 'text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        <span className="truncate">系统默认</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); previewVoice(undefined); }}
                          className={cn(
                            'flex-shrink-0 p-1 rounded transition-colors',
                            darkMode ? 'hover:bg-white/[0.1] text-gray-500 hover:text-white/70' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                          )}
                          title="试听"
                        >
                          <Play className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Azure Neural 语音 */}
                      <div className={cn(
                        'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider',
                        darkMode ? 'text-blue-400/60' : 'text-blue-500'
                      )}>
                        ☁️ Azure Neural 语音
                      </div>
                      {AZURE_VOICES.map((v) => {
                        const isActive = settings.speechVoice === v.voiceURI;
                        return (
                          <div
                            key={v.voiceURI}
                            onClick={() => { setSpeechVoice(v.voiceURI); setVoiceDropdownOpen(false); }}
                            className={cn(
                              'px-3 py-2 text-xs cursor-pointer truncate transition-colors flex items-center justify-between gap-1',
                              isActive
                                ? darkMode ? 'bg-blue-500/15 text-blue-300' : 'bg-blue-50 text-blue-600'
                                : darkMode ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white/70' : 'text-gray-600 hover:bg-gray-50'
                            )}
                            title={`${v.name} (${v.lang}) — 点击选择，需要 Azure 语音服务`}
                          >
                            <span className="truncate flex-1">{v.name} ({v.lang})</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); previewVoice(v.voiceURI); }}
                              className={cn(
                                'flex-shrink-0 p-1 rounded transition-colors',
                                darkMode ? 'hover:bg-white/[0.1] text-gray-500 hover:text-white/70' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                              )}
                              title="试听此语音"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSpeechVoiceFavorite(v.voiceURI); playClick(); }}
                              className={cn(
                                'flex-shrink-0 p-1 rounded transition-colors',
                                settings.favoriteVoices.includes(v.voiceURI)
                                  ? 'text-yellow-400 hover:bg-white/[0.1]'
                                  : darkMode ? 'hover:bg-white/[0.1] text-gray-600 hover:text-yellow-400' : 'hover:bg-gray-200 text-gray-300 hover:text-yellow-500'
                              )}
                              title={settings.favoriteVoices.includes(v.voiceURI) ? '取消收藏' : '收藏此语音'}
                            >
                              <Star className={cn('w-3 h-3', settings.favoriteVoices.includes(v.voiceURI) && 'fill-current')} />
                            </button>
                          </div>
                        );
                      })}

                      {/* MiMo TTS 语音 */}
                      <div className={cn(
                        'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider',
                        darkMode ? 'text-orange-400/60' : 'text-orange-500'
                      )}>
                        🎙️ MiMo TTS 语音 (限时免费)
                      </div>
                      {MIMO_VOICES.map((v) => {
                        const isActive = settings.speechVoice === v.voiceURI;
                        return (
                          <div
                            key={v.voiceURI}
                            onClick={() => { setSpeechVoice(v.voiceURI); setVoiceDropdownOpen(false); }}
                            className={cn(
                              'px-3 py-2 text-xs cursor-pointer truncate transition-colors flex items-center justify-between gap-1',
                              isActive
                                ? darkMode ? 'bg-orange-500/15 text-orange-300' : 'bg-orange-50 text-orange-600'
                                : darkMode ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white/70' : 'text-gray-600 hover:bg-gray-50'
                            )}
                            title={`${v.name} (${v.lang}) — 点击选择，需配置 MiMo API Key`}
                          >
                            <span className="truncate flex-1">{v.name} ({v.lang})</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); previewVoice(v.voiceURI); }}
                              className={cn(
                                'flex-shrink-0 p-1 rounded transition-colors',
                                darkMode ? 'hover:bg-white/[0.1] text-gray-500 hover:text-white/70' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                              )}
                              title="试听此语音"
                            >
                              <Play className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSpeechVoiceFavorite(v.voiceURI); playClick(); }}
                              className={cn(
                                'flex-shrink-0 p-1 rounded transition-colors',
                                settings.favoriteVoices.includes(v.voiceURI)
                                  ? 'text-yellow-400 hover:bg-white/[0.1]'
                                  : darkMode ? 'hover:bg-white/[0.1] text-gray-600 hover:text-yellow-400' : 'hover:bg-gray-200 text-gray-300 hover:text-yellow-500'
                              )}
                              title={settings.favoriteVoices.includes(v.voiceURI) ? '取消收藏' : '收藏此语音'}
                            >
                              <Star className={cn('w-3 h-3', settings.favoriteVoices.includes(v.voiceURI) && 'fill-current')} />
                            </button>
                          </div>
                        );
                      })}

                      {/* 收藏语音 */}
                      {settings.favoriteVoices.length > 0 && (
                        <>
                          <div className={cn(
                            'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider',
                            darkMode ? 'text-yellow-500/60' : 'text-yellow-600'
                          )}>
                            ⭐ 收藏语音
                          </div>
                          {voices.filter(v => settings.favoriteVoices.includes(v.voiceURI)).map((v) => {
                            const isActive = settings.speechVoice === v.voiceURI;
                            return (
                              <div
                                key={v.voiceURI}
                                onClick={() => { setSpeechVoice(v.voiceURI); setVoiceDropdownOpen(false); }}
                                className={cn(
                                  'px-3 py-2 text-xs cursor-pointer truncate transition-colors flex items-center justify-between gap-1',
                                  isActive
                                    ? darkMode ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-600'
                                    : darkMode ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white/70' : 'text-gray-600 hover:bg-gray-50'
                                )}
                                title={`${v.name} (${v.lang}) — 点击选择，点击 ▶ 试听`}
                              >
                                <span className="truncate flex-1">{v.name} ({v.lang})</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); previewVoice(v.voiceURI); }}
                                  className={cn(
                                    'flex-shrink-0 p-1 rounded transition-colors',
                                    darkMode ? 'hover:bg-white/[0.1] text-gray-500 hover:text-white/70' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                                  )}
                                  title="试听此语音"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSpeechVoiceFavorite(v.voiceURI); playClick(); }}
                                  className="flex-shrink-0 p-1 rounded transition-colors text-yellow-400 hover:bg-white/[0.1]"
                                  title="取消收藏"
                                >
                                  <Star className="w-3 h-3 fill-current" />
                                </button>
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* 其他语音 */}
                      {voices.filter(v => !settings.favoriteVoices.includes(v.voiceURI)).length > 0 && (
                        <>
                          <div className={cn(
                            'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider',
                            darkMode ? 'text-gray-600' : 'text-gray-400'
                          )}>
                            其他语音
                          </div>
                          {voices.filter(v => !settings.favoriteVoices.includes(v.voiceURI)).map((v) => {
                            const isActive = settings.speechVoice === v.voiceURI;
                            return (
                              <div
                                key={v.voiceURI}
                                onClick={() => { setSpeechVoice(v.voiceURI); setVoiceDropdownOpen(false); }}
                                className={cn(
                                  'px-3 py-2 text-xs cursor-pointer truncate transition-colors flex items-center justify-between gap-1',
                                  isActive
                                    ? darkMode ? 'bg-purple-500/15 text-purple-300' : 'bg-purple-50 text-purple-600'
                                    : darkMode ? 'text-gray-400 hover:bg-white/[0.06] hover:text-white/70' : 'text-gray-600 hover:bg-gray-50'
                                )}
                                title={`${v.name} (${v.lang}) — 点击选择，点击 ▶ 试听`}
                              >
                                <span className="truncate flex-1">{v.name} ({v.lang})</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); previewVoice(v.voiceURI); }}
                                  className={cn(
                                    'flex-shrink-0 p-1 rounded transition-colors',
                                    darkMode ? 'hover:bg-white/[0.1] text-gray-500 hover:text-white/70' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                                  )}
                                  title="试听此语音"
                                >
                                  <Play className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleSpeechVoiceFavorite(v.voiceURI); playClick(); }}
                                  className={cn(
                                    'flex-shrink-0 p-1 rounded transition-colors',
                                    darkMode ? 'hover:bg-white/[0.1] text-gray-600 hover:text-yellow-400' : 'hover:bg-gray-200 text-gray-300 hover:text-yellow-500'
                                  )}
                                  title="收藏此语音"
                                >
                                  <Star className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
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
              {(() => {
                const providers = useProviderStore.getState().providers;
                const allModels = getAllModels(providers);
                return allModels.map((item) => {
                  const opt = { value: item.model.id, label: item.model.name, desc: `${item.providerName}` };
                  const isSelected = (session?.model ?? settings.defaultModel) === opt.value;
                  return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDefaultModel(opt.value);
                    if (activeId) setModel(activeId, opt.value);
                    playClick();
                  }}
                  className={cn(
                    'group flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all duration-200 text-left',
                    isSelected
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
                      isSelected
                        ? darkMode ? 'bg-cyan-500/15' : 'bg-cyan-100'
                        : darkMode ? 'bg-white/[0.04]' : 'bg-gray-100'
                    )}>
                      <Zap className={cn(
                        'w-4 h-4',
                        isSelected
                          ? darkMode ? 'text-cyan-400' : 'text-cyan-600'
                          : darkMode ? 'text-gray-500' : 'text-gray-400'
                      )} />
                    </div>
                    <div>
                      <div className={cn(
                        'text-sm font-medium',
                        isSelected
                          ? darkMode ? 'text-white/90' : 'text-gray-800'
                          : darkMode ? 'text-white/65' : 'text-gray-600'
                      )}>{opt.label}</div>
                      <div className={cn(
                        'text-xs mt-0.5',
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      )}>{opt.desc}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      darkMode ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]' : 'bg-indigo-500'
                    )} />
                  )}
                </button>
                  );
                });
              })()}
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
                  if (e.target.checked) playToggleOn();
                  else playToggleOff();
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

          {/* ── Background Music ── */}
          <section>
            <h3 className={cn(
              'text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-1.5',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Music className="w-3 h-3" /> 背景音乐
            </h3>
            <button
              onClick={() => {
                toggleMusicEnabled();
                settings.musicEnabled ? playToggleOff() : playToggleOn();
              }}
              className={cn(
                'w-full rounded-xl border p-3.5 flex items-center gap-3 text-left transition-all duration-300',
                settings.musicEnabled
                  ? darkMode
                    ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.06] to-cyan-500/[0.04] shadow-[0_0_12px_rgba(0,255,136,0.06)]'
                    : 'border-emerald-300 bg-emerald-50'
                  : darkMode
                    ? 'border-white/[0.06] hover:border-white/[0.12]'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                settings.musicEnabled
                  ? darkMode ? 'bg-emerald-500/15' : 'bg-emerald-100'
                  : darkMode ? 'bg-white/[0.04]' : 'bg-gray-100'
              )}>
                <Music className={cn('w-5 h-5', darkMode ? 'text-emerald-400' : 'text-emerald-600')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('text-sm font-medium', darkMode ? 'text-white/80' : 'text-gray-700')}>
                  {settings.musicEnabled ? '音乐已开启' : '音乐已关闭'}
                </div>
                <div className={cn('text-[11px] mt-0.5', darkMode ? 'text-gray-500' : 'text-gray-400')}>
                  轻量背景音乐 · Web Audio 合成
                </div>
              </div>
              {settings.musicEnabled && (
                <div className={cn('w-2 h-2 rounded-full', darkMode ? 'bg-emerald-400 shadow-[0_0_6px_rgba(0,255,136,0.6)]' : 'bg-emerald-500')} />
              )}
            </button>

            {/* Volume slider */}
            {settings.musicEnabled && (
              <div className="mt-2.5 flex items-center gap-2.5">
                <Volume2 className={cn(
                  'w-4 h-4 flex-shrink-0',
                  settings.musicVolume <= 0
                    ? darkMode ? 'text-gray-600' : 'text-gray-400'
                    : darkMode ? 'text-emerald-400' : 'text-emerald-600'
                )} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className={cn(
                    'flex-1 h-1.5 rounded-full appearance-none cursor-pointer',
                    '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer',
                    darkMode
                      ? 'bg-white/[0.08] [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(0,255,136,0.4)]'
                      : 'bg-gray-200 [&::-webkit-slider-thumb]:bg-emerald-500'
                  )}
                />
                <span className={cn(
                  'text-[11px] w-8 text-right flex-shrink-0 tabular-nums',
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                )}>
                  {settings.musicVolume}%
                </span>
              </div>
            )}

            {/* Music mode selector */}
            {settings.musicEnabled && (
              <div className="mt-2.5">
                <label className={cn(
                  'text-[11px] font-medium mb-1.5 block',
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                )}>
                  播放模式
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { value: 'random', label: '随机' },
                    { value: 'sequential', label: '顺序' },
                    { value: '5min', label: '5分钟' },
                    { value: '10min', label: '10分钟' },
                  ] as { value: MusicMode; label: string }[]).map((mode) => {
                    const isActive = settings.musicMode === mode.value;
                    return (
                      <button
                        key={mode.value}
                        onClick={() => { setMusicMode(mode.value); playClick(); }}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-xs transition-all border',
                          isActive
                            ? darkMode
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-700'
                            : darkMode
                              ? 'bg-white/[0.03] border-white/[0.08] text-gray-500 hover:border-white/[0.15]'
                              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        )}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Track list with preview */}
            {settings.musicEnabled && (
              <div className="mt-2.5">
                <label className={cn(
                  'text-[11px] font-medium mb-1.5 block',
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                )}>
                  音乐风格
                </label>
                <div className="space-y-1 max-h-[160px] overflow-y-auto custom-scrollbar">
                  {MUSIC_TRACKS.map((t) => (
                    <div
                      key={t.index}
                      className={cn(
                        'flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors',
                        darkMode ? 'hover:bg-white/[0.04] text-gray-400' : 'hover:bg-gray-50 text-gray-600'
                      )}
                    >
                      <span>{t.name} <span className="text-[10px] opacity-50">· {t.pattern === 'arpeggio' ? '琶音' : '长音'} · {t.bpm} BPM</span></span>
                      <button
                        onClick={(e) => { e.stopPropagation(); previewTrack(t.index); }}
                        className={cn(
                          'p-1 rounded transition-colors',
                          darkMode ? 'hover:bg-white/[0.1] text-gray-500 hover:text-emerald-400' : 'hover:bg-gray-200 text-gray-400 hover:text-emerald-600'
                        )}
                        title="试听"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ═══ Appearance Settings ═══ */}
          <section>
            <h3 className={cn(
              'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Palette className="w-3 h-3" />
              外观设置
            </h3>

            {/* Accent color */}
            <div className="mb-4">
              <label className={cn(
                'text-[11px] font-medium mb-2 block',
                darkMode ? 'text-gray-500' : 'text-gray-500'
              )}>
                强调色
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => { playClick(); setAccentColor(color.value); }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
                      settings.accentColor === color.value
                        ? darkMode
                          ? 'bg-white/[0.06] border border-white/[0.15] text-white/85'
                          : 'bg-white border border-gray-300 shadow-sm text-gray-800'
                        : darkMode
                          ? 'border border-transparent text-gray-500 hover:bg-white/[0.03]'
                          : 'border border-transparent text-gray-400 hover:bg-gray-100'
                    )}
                    title={color.label}
                  >
                    <span
                      className={cn('w-3.5 h-3.5 rounded-full', color.class)}
                      style={{
                        boxShadow: settings.accentColor === color.value
                          ? `0 0 8px ${color.glow}`
                          : 'none',
                      }}
                    />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font size */}
            <div className="mb-4">
              <label className={cn(
                'flex items-center gap-1.5 text-[11px] font-medium mb-2',
                darkMode ? 'text-gray-500' : 'text-gray-500'
              )}>
                <Type className="w-3 h-3" />
                消息字体大小
              </label>
              <div className="flex gap-1.5">
                {([
                  { value: 'sm', label: '小' },
                  { value: 'base', label: '中' },
                  { value: 'lg', label: '大' },
                ] as const).map((size) => (
                  <button
                    key={size.value}
                    onClick={() => { playClick(); setFontSize(size.value); }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
                      settings.fontSize === size.value
                        ? darkMode
                          ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-600'
                        : darkMode
                          ? 'bg-white/[0.02] border border-white/[0.06] text-gray-500 hover:border-white/[0.12]'
                          : 'bg-gray-50 border border-gray-200 text-gray-400 hover:border-gray-300'
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Show timestamps */}
            <div className="mb-4">
              <button
                onClick={() => { playClick(); setShowTimestamps(!settings.showTimestamps); }}
                className="flex items-center gap-2.5 w-full"
              >
                <div className={cn(
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  settings.showTimestamps
                    ? darkMode ? 'bg-cyan-500/30' : 'bg-indigo-500'
                    : darkMode ? 'bg-white/[0.08]' : 'bg-gray-200'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 bg-white shadow-sm',
                    settings.showTimestamps ? 'left-[18px]' : 'left-[2px]'
                  )} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className={cn('w-3.5 h-3.5', darkMode ? 'text-gray-400' : 'text-gray-500')} />
                  <span className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                    显示消息时间
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* ═══ Notifications & Behavior ═══ */}
          <section className="mb-6">
            <h3 className={cn(
              'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Bell className="w-3 h-3" />
              通知与行为
            </h3>

            {/* Desktop notifications */}
            <div className="mb-3">
              <button
                onClick={() => { playClick(); setNotificationsEnabled(!settings.notificationsEnabled); }}
                className="flex items-center gap-2.5 w-full"
              >
                <div className={cn(
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  settings.notificationsEnabled
                    ? darkMode ? 'bg-cyan-500/30' : 'bg-indigo-500'
                    : darkMode ? 'bg-white/[0.08]' : 'bg-gray-200'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 bg-white shadow-sm',
                    settings.notificationsEnabled ? 'left-[18px]' : 'left-[2px]'
                  )} />
                </div>
                <div className="flex items-center gap-1.5">
                  {settings.notificationsEnabled ? (
                    <Bell className={cn('w-3.5 h-3.5', darkMode ? 'text-cyan-400' : 'text-indigo-500')} />
                  ) : (
                    <BellOff className={cn('w-3.5 h-3.5', darkMode ? 'text-gray-500' : 'text-gray-400')} />
                  )}
                  <span className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                    桌面通知（回复完成时提醒）
                  </span>
                </div>
              </button>
            </div>

            {/* AI auto title */}
            <div className="mb-3">
              <button
                onClick={() => { playClick(); setAutoTitleAI(!settings.autoTitleAI); }}
                className="flex items-center gap-2.5 w-full"
              >
                <div className={cn(
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  settings.autoTitleAI
                    ? darkMode ? 'bg-cyan-500/30' : 'bg-indigo-500'
                    : darkMode ? 'bg-white/[0.08]' : 'bg-gray-200'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 bg-white shadow-sm',
                    settings.autoTitleAI ? 'left-[18px]' : 'left-[2px]'
                  )} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Bot className={cn('w-3.5 h-3.5', darkMode ? 'text-purple-400' : 'text-purple-500')} />
                  <span className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                    AI 自动生成对话标题
                  </span>
                </div>
              </button>
            </div>

            {/* Context bar */}
            <div className="mb-3">
              <button
                onClick={() => { playClick(); setShowContextBar(!settings.showContextBar); }}
                className="flex items-center gap-2.5 w-full"
              >
                <div className={cn(
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  settings.showContextBar
                    ? darkMode ? 'bg-cyan-500/30' : 'bg-indigo-500'
                    : darkMode ? 'bg-white/[0.08]' : 'bg-gray-200'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 bg-white shadow-sm',
                    settings.showContextBar ? 'left-[18px]' : 'left-[2px]'
                  )} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Gauge className={cn('w-3.5 h-3.5', darkMode ? 'text-emerald-400' : 'text-emerald-500')} />
                  <span className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                    显示上下文窗口用量条
                  </span>
                </div>
              </button>
            </div>

            {/* Voice auto-send */}
            <div className="mb-3">
              <button
                onClick={() => { playClick(); setVoiceAutoSend(!settings.voiceAutoSend); }}
                className="flex items-center gap-2.5 w-full"
              >
                <div className={cn(
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  settings.voiceAutoSend
                    ? darkMode ? 'bg-cyan-500/30' : 'bg-indigo-500'
                    : darkMode ? 'bg-white/[0.08]' : 'bg-gray-200'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 bg-white shadow-sm',
                    settings.voiceAutoSend ? 'left-[18px]' : 'left-[2px]'
                  )} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Mic className={cn('w-3.5 h-3.5', darkMode ? 'text-rose-400' : 'text-rose-500')} />
                  <span className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                    语音输入后自动发送
                  </span>
                </div>
              </button>
            </div>

            {/* Archive toggle */}
            <div className="mb-3">
              <button
                onClick={() => { playClick(); setShowArchived(!settings.showArchived); }}
                className="flex items-center gap-2.5 w-full"
              >
                <div className={cn(
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  settings.showArchived
                    ? darkMode ? 'bg-amber-500/30' : 'bg-amber-500'
                    : darkMode ? 'bg-white/[0.08]' : 'bg-gray-200'
                )}>
                  <div className={cn(
                    'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 bg-white shadow-sm',
                    settings.showArchived ? 'left-[18px]' : 'left-[2px]'
                  )} />
                </div>
                <div className="flex items-center gap-1.5">
                  <Server className={cn('w-3.5 h-3.5', darkMode ? 'text-amber-400' : 'text-amber-500')} />
                  <span className={cn('text-xs', darkMode ? 'text-gray-300' : 'text-gray-600')}>
                    侧栏显示已归档对话
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* ═══ API 提供商管理 ═══ */}
          <section className="mb-6">
            <h3 className={cn(
              'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Server className="w-3 h-3" />
              API 提供商与模型
            </h3>
            <ProviderManager darkMode={darkMode} />
          </section>

          {/* ═══ Data Management ═══ */}
          {/* Language selector */}
          <section className="mb-6">
            <h3 className={cn(
              'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Globe className="w-3 h-3" />
              {t('settings.language')}
            </h3>
            <div className="flex gap-2">
              {(['zh', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => { playClick(); i18n.changeLanguage(lang); setLanguage(lang); }}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm transition-all duration-200',
                    i18n.language === lang
                      ? darkMode
                        ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                        : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                      : darkMode
                        ? 'bg-white/[0.03] border border-white/[0.06] text-gray-500 hover:text-gray-300'
                        : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-700'
                  )}
                >
                  {lang === 'zh' ? '中文' : 'English'}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className={cn(
              'flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider mb-3',
              darkMode ? 'text-gray-500' : 'text-gray-400'
            )}>
              <Download className="w-3 h-3" />
              {t('settings.dataManagement')}
            </h3>

            <div className="flex flex-wrap gap-2">
              {/* Export settings */}
              <button
                onClick={() => {
                  playClick();
                  const json = exportSettings();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'deepseek-chat-settings.json';
                  a.click();
                  URL.revokeObjectURL(url);
                  toast('设置已导出', 'success');
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
                  darkMode
                    ? 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-cyan-400 hover:border-cyan-500/30'
                    : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-indigo-600'
                )}
              >
                <Download className="w-3 h-3" />
                导出设置
              </button>

              {/* Import settings */}
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    const ok = importSettings(text);
                    if (ok) {
                      toast('设置已导入', 'success');
                    } else {
                      toast('导入失败：无效的 JSON 格式', 'error');
                    }
                  };
                  input.click();
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
                  darkMode
                    ? 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30'
                    : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-emerald-600'
                )}
              >
                <Upload className="w-3 h-3" />
                导入设置
              </button>

              {/* Reset settings */}
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: '重置设置',
                    message: '确定要将所有设置恢复为默认值吗？此操作不可撤销。',
                    variant: 'danger',
                    confirmLabel: '重置',
                  });
                  if (!ok) return;
                  playClick();
                  resetSettings();
                  toast('所有设置已恢复默认', 'success');
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-200',
                  darkMode
                    ? 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-red-400 hover:border-red-500/30'
                    : 'bg-gray-50 border border-gray-200 text-gray-500 hover:text-red-500'
                )}
              >
                <RotateCcw className="w-3 h-3" />
                重置设置
              </button>
            </div>
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
