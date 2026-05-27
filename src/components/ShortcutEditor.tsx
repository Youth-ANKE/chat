import { useState } from 'react';
import { X, RotateCcw, Keyboard } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { DEFAULT_SHORTCUTS, type ShortcutBinding } from '../types';
import { playClick } from '../lib/sound';

interface ShortcutEditorProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutEditor({ open, onClose }: ShortcutEditorProps) {
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const customShortcuts = useSettingsStore((s) => s.settings.customShortcuts) || {};
  const setCustomShortcuts = useSettingsStore((s) => s.setCustomShortcuts);

  const [editingId, setEditingId] = useState<string | null>(null);

  if (!open) return null;

  // Build merged shortcuts: defaults + custom overrides
  const shortcuts: (ShortcutBinding & { isCustom: boolean })[] = DEFAULT_SHORTCUTS.map((s) => ({
    ...s,
    currentKeys: customShortcuts[s.id] || s.currentKeys,
    isCustom: s.id in customShortcuts,
  }));

  const handleStartRecord = (id: string) => {
    setEditingId(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (editingId === null) return;
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    const key = e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta'
      ? null
      : e.key.length === 1 ? e.key.toUpperCase() : e.key;

    if (parts.length === 0 && key) parts.push(key!);
    else if (key && parts.length > 0) parts.push(key!);

    if (parts.length > 0 && key) {
      const combo = parts.join('+');
      const updated = { ...customShortcuts, [editingId]: combo };
      setCustomShortcuts(updated);
      setEditingId(null);
    }
  };

  const handleReset = (id: string) => {
    playClick();
    const { [id]: _, ...rest } = customShortcuts;
    setCustomShortcuts(rest);
  };

  const handleResetAll = () => {
    playClick();
    setCustomShortcuts({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-md mx-4 rounded-2xl border overflow-hidden ${
          darkMode ? 'backdrop-blur-[45px] saturate-[200%] bg-black/[0.32] border-cyan-500/20 shadow-[0_8px_50px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]' : 'bg-white border-gray-200 shadow-2xl'
        }`}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b backdrop-blur-[30px] saturate-[180%] ${darkMode ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-200 bg-white/80'}`}>
          <div className="flex items-center gap-2.5">
            <Keyboard className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
            <h2 className={`text-base font-semibold ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>自定义快捷键</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <div className="p-4 space-y-1">
            {shortcuts.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-sm truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{s.label}</span>
                  {s.isCustom && (
                    <span className={`text-[9px] px-1 rounded ${darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-50 text-indigo-500'}`}>
                      自定义
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {s.isCustom && (
                    <button
                      onClick={() => handleReset(s.id)}
                      className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-600 hover:text-amber-400' : 'hover:bg-gray-200 text-gray-400 hover:text-amber-500'}`}
                      title="恢复默认"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  {editingId === s.id ? (
                    <kbd className={`inline-flex items-center justify-center min-w-[70px] h-6 px-2 rounded-md text-xs font-mono animate-pulse ${
                      darkMode ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400' : 'bg-indigo-50 border border-indigo-300 text-indigo-600'
                    }`}>
                      按下组合键...
                    </kbd>
                  ) : (
                    <button
                      onClick={() => handleStartRecord(s.id)}
                      className={`inline-flex items-center justify-center min-w-[70px] h-6 px-2 rounded-md text-xs font-mono transition-all ${
                        darkMode
                          ? 'bg-white/[0.04] border border-white/[0.08] text-cyan-400/80 hover:border-cyan-500/30 hover:bg-cyan-500/[0.06]'
                          : 'bg-gray-100 border border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      {s.currentKeys}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`px-5 py-3 border-t flex items-center justify-between backdrop-blur-[30px] saturate-[180%] ${darkMode ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-200 bg-white/80'}`}>
          <p className={`text-[11px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            点击快捷键按钮后按下组合键
          </p>
          <button
            onClick={handleResetAll}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${
              darkMode ? 'hover:bg-white/[0.04] text-gray-500 hover:text-red-400' : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            全部重置
          </button>
        </div>
      </div>
    </div>
  );
}
