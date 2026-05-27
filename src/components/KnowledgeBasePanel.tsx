import { useState, useRef } from 'react';
import { X, FileUp, Trash2, Database, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { useConfirm } from './ConfirmDialog';
import { playClick, playDelete } from '../lib/sound';

interface KnowledgeBasePanelProps {
  onClose: () => void;
}

export function KnowledgeBasePanel({ onClose }: KnowledgeBasePanelProps) {
  const { t } = useTranslation();
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const { documents, addDocument, removeDocument, clearAll } = useKnowledgeStore();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        let type: 'pdf' | 'docx' | 'txt' | 'md' = 'txt';
        if (file.name.endsWith('.md')) type = 'md';
        addDocument(file.name, type, reader.result);
        playClick();
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`fixed top-0 right-0 w-[380px] h-full z-40 border-l flex flex-col ${
      darkMode ? 'glass border-white/[0.06]' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        darkMode ? 'border-white/[0.06]' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <Database className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
          <span className={`font-medium text-sm ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>
            {t('knowledge.knowledgeBase')}
          </span>
          <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {documents.length} {t('knowledge.documents')}
          </span>
        </div>
        <button onClick={onClose} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Upload area */}
      <div className="p-3">
        <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.py,.java" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
            darkMode
              ? 'border-white/[0.08] hover:border-cyan-500/30 text-gray-500 hover:text-cyan-400'
              : 'border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-500'
          }`}
        >
          <FileUp className="w-6 h-6" />
          <span className="text-xs">{t('knowledge.uploadDoc')}</span>
        </button>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-gray-500">
            <BookOpen className="w-8 h-8 opacity-20" />
            <span className="text-xs">{t('knowledge.noDocs')}</span>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                  darkMode ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <FileUp className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-400/60' : 'text-indigo-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium truncate ${
                    darkMode ? 'text-white/70' : 'text-gray-600'
                  }`}>{doc.name}</div>
                  <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {doc.chunks.length} {t('knowledge.chunkCount')}
                  </div>
                </div>
                <button
                  onClick={() => { playDelete(); removeDocument(doc.id); }}
                  className={`p-0.5 rounded transition-colors ${
                    darkMode ? 'hover:bg-red-500/10 text-gray-600 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear all */}
      {documents.length > 0 && (
        <div className={`px-3 py-3 border-t ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          <button
            onClick={async () => {
              const ok = await confirm({ message: '清空所有知识库文档？', variant: 'danger' });
              if (ok) { playDelete(); clearAll(); }
            }}
            className={`w-full py-2 rounded-lg text-xs transition-colors ${
              darkMode ? 'text-red-400/60 hover:text-red-400 hover:bg-red-500/10' : 'text-red-400 hover:text-red-500 hover:bg-red-50'
            }`}
          >
            {t('common.clear')}
          </button>
        </div>
      )}
    </div>
  );
}
