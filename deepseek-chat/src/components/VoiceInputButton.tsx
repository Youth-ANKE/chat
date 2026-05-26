import { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../lib/voice';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick } from '../lib/sound';

interface VoiceInputButtonProps {
  onText: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({ onText, disabled, className = '' }: VoiceInputButtonProps) {
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const { isListening, isSupported, toggleListening } = useVoiceInput({
    lang: 'zh-CN',
    onResult: (text) => {
      if (text.trim()) onText(text.trim());
    },
    onError: (msg) => console.warn('Voice error:', msg),
  });

  if (!isSupported) return null;

  return (
    <button
      onClick={() => { playClick(); toggleListening(); }}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-30 ${
        isListening
          ? darkMode
            ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40 shadow-[0_0_14px_rgba(239,68,68,0.25)] animate-pulse'
            : 'bg-red-100 text-red-600 ring-1 ring-red-400/40'
          : darkMode
            ? 'text-white/35 hover:text-cyan-400 hover:bg-white/[0.06]'
            : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-200/60'
      } ${className}`}
      title={isListening ? '点击停止' : '语音输入'}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}
