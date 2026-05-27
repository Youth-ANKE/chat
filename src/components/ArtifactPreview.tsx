import { useState } from 'react';
import { X, Maximize2, Minimize2, Code2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';

interface ArtifactPreviewProps {
  code: string;
  language: string;
  onClose: () => void;
}

const PREVIEWABLE_LANGS = ['html', 'htm', 'svg', 'javascript', 'js', 'jsx', 'typescript', 'ts', 'tsx'];

export function ArtifactPreview({ code, language, onClose }: ArtifactPreviewProps) {
  const { t } = useTranslation();
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const [fullscreen, setFullscreen] = useState(false);

  const langKey = language?.toLowerCase() || '';
  const canPreview = PREVIEWABLE_LANGS.includes(langKey) || code.includes('<html') || code.includes('<!DOCTYPE');

  return (
    <div
      className={`fixed ${
        fullscreen ? 'inset-0 z-50' : 'top-0 right-0 w-[45%] h-full z-40'
      } flex flex-col border-l transition-all duration-300 ${
        darkMode ? 'bg-[#0a0a16] border-white/[0.06]' : 'bg-white border-gray-200'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        darkMode ? 'border-white/[0.06]' : 'border-gray-100'
      }`}>
        <div className="flex items-center gap-2">
          <Code2 className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
          <span className={`text-sm font-medium ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>
            {t('artifacts.previewCode')}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-indigo-100 text-indigo-600'
          }`}>
            {language || 'html'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className={`p-1.5 rounded transition-colors ${
              darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title={fullscreen ? t('artifacts.closePreview') : t('artifacts.fullscreen')}
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className={`p-1.5 rounded transition-colors ${
              darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview */}
      {canPreview ? (
        <iframe
          srcDoc={langKey === 'svg' ? code : wrapHTML(code, langKey)}
          className="flex-1 w-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="code preview"
        />
      ) : (
        <div className={`flex-1 flex items-center justify-center ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          <p className="text-sm">{t('artifacts.noCode')}</p>
        </div>
      )}
    </div>
  );
}

function wrapHTML(code: string, lang: string): string {
  if (lang === 'html' || lang === 'htm' || code.includes('<html') || code.includes('<!DOCTYPE')) {
    return code;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;padding:1rem;line-height:1.6;}</style></head><body>${code}</body></html>`;
}
