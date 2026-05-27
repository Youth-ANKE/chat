import { useState, useRef } from 'react';
import { X, FileUp, Trash2, Database, BookOpen, Search, Zap, FileText } from 'lucide-react';
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
  const { documents, addDocument, removeDocument, searchChunks, clearAll } = useKnowledgeStore();
  const { confirm } = useConfirm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    playClick();
    const results = searchChunks(searchQuery, 5);
    setSearchResults(results);
  };

  const formatter = (num: number) => num >= 1000 ? `${(num / 1000).toFixed(1)}K` : String(num);
  const totalChunks = documents.reduce((s, d) => s + d.chunks.length, 0);
  const totalChars = documents.reduce((s, d) => s + d.chunks.reduce((cs, c) => cs + c.content.length, 0), 0);

  return (
    <div className={`fixed top-0 right-0 w-[400px] h-full z-40 border-l flex flex-col shadow-2xl ${
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

      {/* Stats overview */}
      {documents.length > 0 && (
        <div className={`px-4 py-2.5 grid grid-cols-3 gap-2 border-b ${darkMode ? 'border-white/[0.04]' : 'border-gray-100'}`}>
          <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
            <div className={`text-lg font-bold ${darkMode ? 'text-cyan-400' : 'text-indigo-600'}`}>{documents.length}</div>
            <div className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>文档</div>
          </div>
          <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
            <div className={`text-lg font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>{formatter(totalChunks)}</div>
            <div className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>分块</div>
          </div>
          <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
            <div className={`text-lg font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatter(totalChars)}</div>
            <div className={`text-[9px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>字符</div>
          </div>
        </div>
      )}

      {/* Search bar */}
      {totalChunks > 0 && (
        <div className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setSearchResults([]); }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索知识库内容..."
                className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none transition-all ${
                  darkMode ? 'bg-white/[0.03] border border-white/[0.06] focus:border-cyan-500/30 text-white/80 placeholder-gray-600' : 'bg-gray-100 border border-gray-200 focus:border-indigo-300 text-gray-700 placeholder-gray-400'
                }`}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
              className={`px-3 py-2 rounded-lg text-xs transition-colors disabled:opacity-30 ${
                darkMode ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-indigo-500 text-white hover:bg-indigo-600'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="px-3 pb-2">
          <div className={`text-[10px] font-semibold mb-1.5 ${darkMode ? 'text-cyan-400/80' : 'text-indigo-500'}`}>
            <Zap className="w-3 h-3 inline mr-1" />
            搜索到 {searchResults.length} 个匹配片段
          </div>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scrollbar">
            {searchResults.map((r, i) => (
              <div key={i} className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                darkMode ? 'bg-cyan-500/[0.04] border border-cyan-500/10 text-white/70' : 'bg-indigo-50 border border-indigo-100 text-gray-600'
              }`}>
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload area */}
      <div className="p-3">
        <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.xml,.html,.css,.js,.ts,.py,.java" onChange={handleFileUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-full py-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors ${
            darkMode
              ? 'border-white/[0.08] hover:border-cyan-500/30 text-gray-500 hover:text-cyan-400'
              : 'border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-500'
          }`}
        >
          <FileUp className="w-5 h-5" />
          <span className="text-xs">{t('knowledge.uploadDoc')}</span>
          <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>TXT, MD, CSV, JSON, 代码文件</span>
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
              <div key={doc.id}>
                <div
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer ${
                    darkMode ? 'bg-white/[0.03] hover:bg-white/[0.05]' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                >
                  <FileText className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-400/60' : 'text-indigo-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>{doc.name}</div>
                    <div className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {doc.chunks.length} 个片段 · {formatter(doc.chunks.reduce((s, c) => s + c.content.length, 0))} 字符
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); playDelete(); removeDocument(doc.id); }}
                    className={`p-0.5 rounded transition-colors ${
                      darkMode ? 'hover:bg-red-500/10 text-gray-600 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {/* Expanded chunks preview */}
                {expandedDoc === doc.id && (
                  <div className={`ml-2 pl-4 border-l-2 mb-1 space-y-1 ${darkMode ? 'border-cyan-500/10' : 'border-indigo-200'}`}>
                    {doc.chunks.slice(0, 5).map((chunk, i) => (
                      <div key={chunk.id} className={`p-2 rounded text-[10px] leading-relaxed ${
                        darkMode ? 'bg-white/[0.01] text-gray-500' : 'bg-gray-50/50 text-gray-500'
                      }`}>
                        <span className={`font-mono mr-1 ${darkMode ? 'text-cyan-400/40' : 'text-indigo-400'}`}>#{i + 1}</span>
                        {chunk.content.slice(0, 150)}{chunk.content.length > 150 ? '...' : ''}
                      </div>
                    ))}
                    {doc.chunks.length > 5 && (
                      <div className={`text-[10px] text-center py-1 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                        +{doc.chunks.length - 5} 更多片段
                      </div>
                    )}
                  </div>
                )}
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
