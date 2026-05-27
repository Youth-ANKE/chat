import { useState, useRef } from 'react';
import { X, Upload, FileJson, FileText, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';
import { useChatStore } from '../stores/chatStore';
import { importChatGPTExport, importMarkdownConversation } from '../lib/import';
import { useToast } from './Toast';
import type { ChatSession } from '../types';

interface ImportDialogProps {
  onClose: () => void;
}

export function ImportDialog({ onClose }: ImportDialogProps) {
  const { t } = useTranslation();
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markdownInputRef = useRef<HTMLTextAreaElement>(null);
  const [importing, setImporting] = useState(false);
  const [mode, setMode] = useState<'chatgpt' | 'markdown'>('chatgpt');

  const handleChatGPTImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const sessions = await importChatGPTExport(file);
      addSessionsToStore(sessions);
      toast(t('import.importSuccess', { count: sessions.length }), 'success');
      onClose();
    } catch {
      toast(t('import.importError'), 'error');
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMarkdownImport = () => {
    const text = markdownInputRef.current?.value?.trim();
    if (!text) return;
    setImporting(true);
    try {
      const session = importMarkdownConversation(text);
      addSessionsToStore([session]);
      toast(t('import.importSuccess', { count: 1 }), 'success');
      onClose();
    } catch {
      toast(t('import.importError'), 'error');
    }
    setImporting(false);
  };

  const addSessionsToStore = (sessions: Omit<ChatSession, 'model' | 'thinking' | 'temperature' | 'topP' | 'maxTokens' | 'webSearch'>[]) => {
    const { sessions: currentSessions } = useChatStore.getState();
    const defaultModel = useSettingsStore.getState().settings.defaultModel;
    const newSessions: ChatSession[] = sessions.map((s) => ({
      ...s,
      model: defaultModel,
      thinking: true,
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 4096,
      webSearch: false,
    }));
    useChatStore.setState({
      sessions: [...newSessions, ...currentSessions],
      activeId: newSessions[0]?.id || currentSessions[0]?.id,
    });
    // Persist each session
    import('../lib/storage').then(({ saveSession }) => newSessions.forEach((s) => saveSession(s)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-[420px] rounded-2xl border overflow-hidden ${
        darkMode ? 'backdrop-blur-[45px] saturate-[200%] bg-black/[0.30] border-white/[0.08] shadow-[0_8px_50px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]' : 'bg-white border-gray-200 shadow-2xl'
      }`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b backdrop-blur-[30px] saturate-[180%] ${
          darkMode ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-white/80'
        }`}>
          <div className="flex items-center gap-2">
            <Upload className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
            <span className={`font-semibold text-sm ${darkMode ? 'text-white/90' : 'text-gray-800'}`}>
              {t('import.title')}
            </span>
          </div>
          <button onClick={onClose} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Mode selector */}
          <div className="flex gap-2">
            {(['chatgpt', 'markdown'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors ${
                  mode === m
                    ? darkMode ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                    : darkMode ? 'bg-white/[0.03] text-gray-500 border border-white/[0.04] hover:text-gray-300' : 'bg-gray-50 text-gray-500 border border-gray-100 hover:text-gray-700'
                }`}
              >
                {m === 'chatgpt' ? <FileJson className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {m === 'chatgpt' ? t('import.chatGPTFormat') : t('import.markdownFormat')}
              </button>
            ))}
          </div>

          {mode === 'chatgpt' ? (
            <div>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleChatGPTImport} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className={`w-full py-12 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors ${
                  darkMode
                    ? 'border-white/[0.08] hover:border-cyan-500/30 text-gray-500 hover:text-cyan-400'
                    : 'border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-500'
                }`}
              >
                <FileJson className="w-8 h-8" />
                <span className="text-sm">
                  {importing ? t('common.loading') : 'Click to select conversations.json'}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                ref={markdownInputRef}
                rows={8}
                placeholder={`# Title\n\n## User\nYour message here\n\n## AI\nAssistant response here`}
                className={`w-full p-3 rounded-lg text-sm outline-none resize-none ${
                  darkMode
                    ? 'bg-white/[0.03] border border-white/[0.06] text-white/80 placeholder-gray-600'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400'
                }`}
              />
              <button
                onClick={handleMarkdownImport}
                disabled={importing}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors ${
                  darkMode ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                <Check className="w-4 h-4" />
                {importing ? t('common.loading') : t('common.import')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
