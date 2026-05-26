import { useState, useRef } from 'react';
import { X, Image, Link, Copy, Download, Check, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../stores/settingsStore';
import type { ChatSession } from '../types';

interface SharePanelProps {
  session: ChatSession;
  onClose: () => void;
}

export function SharePanel({ session, onClose }: SharePanelProps) {
  const { t } = useTranslation();
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const [tab, setTab] = useState<'image' | 'link'>('image');
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const linkRef = useRef<string>('');

  // Generate shareable link
  const generateLink = () => {
    const data = JSON.stringify({
      t: session.title,
      m: session.model,
      msgs: session.messages.map((m) => ({
        r: m.role,
        c: m.content,
        ...(m.reasoning ? { re: m.reasoning } : {}),
      })),
    });
    const compressed = btoa(encodeURIComponent(data));
    const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`;
    linkRef.current = url;
    return url;
  };

  const copyLink = async () => {
    if (!linkRef.current) generateLink();
    await navigator.clipboard.writeText(linkRef.current);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate share image using canvas
  const generateImage = async () => {
    setGenerating(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#0a0a16;padding:24px;font-family:Inter,sans-serif;color:#e0e0e0;';

      container.innerHTML = `
        <div style="padding:24px;border-radius:16px;border:1px solid rgba(0,229,255,0.15);background:linear-gradient(135deg,#060b14 0%,#0a1628 100%);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(0,229,255,0.1);">
            <div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#00e5ff,#6366f1);display:flex;align-items:center;justify-content:center;">⚡</div>
            <div>
              <div style="font-weight:700;font-size:16px;color:#fff;">${session.title}</div>
              <div style="font-size:11px;color:rgba(0,229,255,0.6);">${session.model} · ${t('share.shareText')}</div>
            </div>
          </div>
          ${session.messages.slice(0, 20).map((m) => {
            const isUser = m.role === 'user';
            return `<div style="margin-bottom:16px;padding:12px 16px;border-radius:12px;${isUser ? 'background:rgba(99,102,241,0.08);border-left:3px solid #6366f1;' : 'background:rgba(0,229,255,0.04);border-left:3px solid #00e5ff;'}">
              <div style="font-size:10px;margin-bottom:6px;color:${isUser ? '#9394f5' : '#00e5ff'};font-weight:600;">${isUser ? 'You' : 'AI'}</div>
              <div style="font-size:13px;line-height:1.7;color:#c0c0d0;white-space:pre-wrap;">${m.content.slice(0, 500)}${m.content.length > 500 ? '...' : ''}</div>
            </div>`;
          }).join('')}
          <div style="text-align:center;margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.05);font-size:10px;color:rgba(255,255,255,0.3);">DeepSeek Chatbox · ${new Date().toLocaleDateString()}</div>
        </div>`;

      document.body.appendChild(container);
      const canvas = await html2canvas(container, { backgroundColor: '#060b14', scale: 2 });
      document.body.removeChild(container);

      setImageUrl(canvas.toDataURL('image/png'));
    } catch (e) {
      console.error('Failed to generate image:', e);
    }
    setGenerating(false);
  };

  const copyImage = async () => {
    if (!imageUrl) return;
    try {
      const blob = await (await fetch(imageUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: just show the image
    }
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${session.title.slice(0, 30)}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`w-[480px] max-h-[80vh] rounded-2xl border flex flex-col overflow-hidden ${
        darkMode ? 'bg-[#0d1117] border-white/[0.06]' : 'bg-white border-gray-200 shadow-2xl'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          darkMode ? 'border-white/[0.06]' : 'border-gray-100'
        }`}>
          <div className="flex items-center gap-2">
            <Share2 className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
            <span className={`font-semibold text-sm ${darkMode ? 'text-white/90' : 'text-gray-800'}`}>
              {t('share.title')}
            </span>
          </div>
          <button onClick={onClose} className={`p-1 rounded ${darkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          {(['image', 'link'] as const).map((tabType) => (
            <button
              key={tabType}
              onClick={() => setTab(tabType)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors ${
                tab === tabType
                  ? darkMode
                    ? 'text-cyan-400 border-b-2 border-cyan-400'
                    : 'text-indigo-600 border-b-2 border-indigo-600'
                  : darkMode
                    ? 'text-gray-500 hover:text-gray-300'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tabType === 'image' ? <Image className="w-4 h-4" /> : <Link className="w-4 h-4" />}
              {tabType === 'image' ? t('share.asImage') : t('share.asLink')}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          {tab === 'image' ? (
            <div className="space-y-4">
              {imageUrl ? (
                <div className="space-y-3">
                  <img src={imageUrl} alt="share preview" className="w-full rounded-lg border border-white/[0.06]" />
                  <div className="flex gap-2">
                    <button
                      onClick={copyImage}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors ${
                        darkMode ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? t('common.copied') : t('share.copyImage')}
                    </button>
                    <button
                      onClick={downloadImage}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors ${
                        darkMode ? 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Download className="w-4 h-4" />
                      {t('share.downloadImage')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generateImage}
                  disabled={generating}
                  className={`w-full py-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors ${
                    darkMode
                      ? 'border-white/[0.08] hover:border-cyan-500/30 text-gray-500 hover:text-cyan-400'
                      : 'border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-500'
                  }`}
                >
                  <Image className="w-8 h-8" />
                  <span className="text-sm">{generating ? 'Generating...' : 'Click to generate share image'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                darkMode ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-gray-50 border border-gray-200'
              }`}>
                <span className="flex-1 truncate font-mono text-xs" style={{ wordBreak: 'break-all' }}>
                  {linkRef.current || generateLink()}
                </span>
              </div>
              <button
                onClick={copyLink}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-colors ${
                  darkMode ? 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('share.linkCopied') : t('share.copyLink')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
