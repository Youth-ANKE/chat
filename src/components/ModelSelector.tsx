import { ChevronDown, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { ModelProvider } from '../types';
import { useProviderStore } from '../stores/providerStore';
import { getModelById } from '../lib/provider-adapter';

interface ModelSelectorProps {
  currentModel: string;
  currentProviderId?: string;
  onSelect: (providerId: string, modelId: string) => void;
  minimal?: boolean;
}

export function ModelSelector({ currentModel, currentProviderId, onSelect, minimal }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const providers = useProviderStore((s) => s.providers);
  const enabled = providers.filter((p) => p.enabled);

  const currentInfo = getModelById(currentModel, providers);
  const displayLabel = currentInfo
    ? `${currentInfo.provider.name} · ${currentInfo.model.name}`
    : (currentModel || '选择模型');

  const updatePos = useCallback(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, []);

  const toggleOpen = useCallback(() => {
    if (!open) updatePos();
    setOpen((v) => !v);
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current && btnRef.current.contains(t)) return;
      if (popupRef.current && popupRef.current.contains(t)) return;
      setOpen(false);
    };
    const handleScroll = () => setOpen(false);
    const handleResize = () => setOpen(false);
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  if (enabled.length === 0) {
    return (
      <span className="text-[11px] text-gray-500">无可用模型</span>
    );
  }

  const dropdown = open && createPortal(
    <div
      ref={popupRef}
      className="fixed w-72 backdrop-blur-[50px] saturate-[200%] brightness-[1.06] bg-black/[0.22] border border-white/[0.08] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden"
      style={{ top: pos.top, left: pos.left, zIndex: 99999 }}
    >
      <div className="max-h-[360px] overflow-y-auto p-1">
        {enabled.map((provider) => (
          <div key={provider.id}>
            <div className="px-3 py-1.5 text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
              {provider.name}
            </div>
            {provider.models.map((model) => {
              const isActive = currentModel === model.id;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(provider.id, model.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400'
                      : 'text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isActive ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,229,255,0.4)]' : 'bg-gray-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{model.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">{model.id}</div>
                  </div>
                  {model.supportsVision && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-purple-500/10 text-purple-400/70">视觉</span>
                  )}
                  {model.supportsThinking && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400/70">推理</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
          minimal
            ? 'bg-transparent hover:bg-white/[0.05] text-gray-400 hover:text-cyan-400'
            : 'bg-white/[0.04] border border-white/[0.08] hover:border-cyan-500/30 text-gray-300'
        }`}
      >
        <Sparkles className="w-3 h-3 text-cyan-400/70" />
        <span className="truncate max-w-[160px]">{displayLabel}</span>
        <ChevronDown className="w-3 h-3 text-gray-500" />
      </button>
      {dropdown}
    </div>
  );
}
