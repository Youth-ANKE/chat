import { useState } from 'react';
import { X, Tag, Plus, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick } from '../lib/sound';

interface TagsPanelProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onClose: () => void;
}

export function TagsPanel({ tags, onAddTag, onRemoveTag, onClose }: TagsPanelProps) {
  const { t } = useTranslation();
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const [newTag, setNewTag] = useState('');

  const handleAdd = () => {
    const trimmed = newTag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      playClick();
      onAddTag(trimmed);
    }
    setNewTag('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-[340px] rounded-2xl border overflow-hidden ${
        darkMode ? 'backdrop-blur-[45px] saturate-[200%] bg-black/[0.30] border-white/[0.08] shadow-[0_8px_50px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]' : 'bg-white border-gray-200 shadow-2xl'
      }`}>
        <div className={`flex items-center justify-between px-4 py-3 border-b backdrop-blur-[30px] saturate-[180%] ${
          darkMode ? 'border-white/[0.06] bg-white/[0.02]' : 'border-gray-100 bg-white/80'
        }`}>
          <div className="flex items-center gap-2">
            <Tag className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
            <span className={`font-medium text-sm ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>
              {t('tags.manageTags')}
            </span>
          </div>
          <button onClick={onClose} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Add tag input */}
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder={t('tags.addTag')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none ${
                darkMode
                  ? 'bg-white/[0.03] border border-white/[0.06] text-white/80 placeholder-gray-600'
                  : 'bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400'
              }`}
            />
            <button
              onClick={handleAdd}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                darkMode ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Existing tags */}
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                  darkMode ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                }`}
              >
                {tag}
                <button onClick={() => onRemoveTag(tag)} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {tags.length === 0 && (
              <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {t('tags.addTag')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
