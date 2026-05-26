import { X, Plus, Eye, EyeOff, Key, Globe, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ModelProvider, ProviderModel } from '../types';
import { useProviderStore } from '../stores/providerStore';

interface ProviderManagerProps {
  darkMode: boolean;
}

export function ProviderManager({ darkMode }: ProviderManagerProps) {
  const { providers, toggleProvider, setApiKey, setBaseUrl, addModel, removeModel } = useProviderStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newModelProvider, setNewModelProvider] = useState<string | null>(null);
  const [newModelData, setNewModelData] = useState({ id: '', name: '', maxTokens: 4096 });

  const toggleShowKey = (id: string) => setShowKeys((s) => ({ ...s, [id]: !s[id] }));

  const handleAddModel = (providerId: string) => {
    if (!newModelData.id || !newModelData.name) return;
    const model: ProviderModel = {
      id: newModelData.id,
      name: newModelData.name,
      maxTokens: newModelData.maxTokens,
      supportsThinking: false,
      supportsVision: false,
      supportsTools: false,
    };
    addModel(providerId, model);
    setNewModelData({ id: '', name: '', maxTokens: 4096 });
    setNewModelProvider(null);
  };

  const inputClass = `w-full px-3 py-2 rounded-lg text-xs outline-none transition-all ${
    darkMode
      ? 'bg-white/[0.04] border border-white/[0.06] focus:border-cyan-500/30 text-white/80 placeholder-gray-600'
      : 'bg-gray-50 border border-gray-200 focus:border-indigo-300 text-gray-700 placeholder-gray-400'
  }`;

  const labelClass = `text-[11px] font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`;

  return (
    <div className="space-y-4">
      <h3 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-purple-400/70' : 'text-purple-600'}`}>
        📡 API 提供商
      </h3>

      <div className="space-y-3">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className={`rounded-xl border p-4 transition-all ${
              provider.enabled
                ? darkMode ? 'border-cyan-500/20 bg-cyan-500/[0.02]' : 'border-indigo-200 bg-indigo-50/30'
                : darkMode ? 'border-white/[0.04] bg-white/[0.01]' : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={labelClass}>{provider.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  darkMode ? 'bg-white/[0.04] text-gray-500' : 'bg-gray-100 text-gray-500'
                }`}>
                  {provider.type}
                </span>
              </div>
              <button
                onClick={() => toggleProvider(provider.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  provider.enabled
                    ? darkMode ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-600 hover:bg-emerald-100'
                    : darkMode ? 'text-gray-600 hover:bg-white/[0.04]' : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={provider.enabled ? '禁用' : '启用'}
              >
                {provider.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {provider.enabled && (
              <div className="space-y-2.5">
                {/* API Key */}
                <div>
                  <label className={labelClass}>
                    <Key className="w-3 h-3 inline mr-1" />API Key
                  </label>
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type={showKeys[provider.id] ? 'text' : 'password'}
                      value={provider.apiKey}
                      onChange={(e) => setApiKey(provider.id, e.target.value)}
                      placeholder="sk-..."
                      className={inputClass}
                    />
                    <button
                      onClick={() => toggleShowKey(provider.id)}
                      className={`px-2 rounded-lg text-xs ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {showKeys[provider.id] ? '隐藏' : '显示'}
                    </button>
                  </div>
                </div>

                {/* Base URL */}
                <div>
                  <label className={labelClass}>
                    <Globe className="w-3 h-3 inline mr-1" />Base URL
                  </label>
                  <input
                    type="text"
                    value={provider.baseUrl ?? ''}
                    onChange={(e) => setBaseUrl(provider.id, e.target.value)}
                    className={`${inputClass} mt-1`}
                    placeholder={provider.type === 'ollama' ? 'http://localhost:11434/v1' : ''}
                  />
                </div>

                {/* Models */}
                <div>
                  <label className={labelClass}>模型列表</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {provider.models.map((m) => (
                      <span
                        key={m.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                          darkMode ? 'bg-white/[0.04] text-gray-400 border border-white/[0.06]' : 'bg-white text-gray-500 border border-gray-200'
                        }`}
                      >
                        {m.name}
                        {provider.type === 'ollama' && (
                          <button
                            onClick={() => removeModel(provider.id, m.id)}
                            className="hover:text-red-400"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </span>
                    ))}
                    <button
                      onClick={() => setNewModelProvider(provider.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                        darkMode ? 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10' : 'text-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <Plus className="w-2.5 h-2.5" />添加
                    </button>
                  </div>
                  {newModelProvider === provider.id && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <input
                        value={newModelData.name}
                        onChange={(e) => setNewModelData((d) => ({ ...d, name: e.target.value }))}
                        placeholder="模型名称"
                        className={`${inputClass} !w-24 !py-1`}
                      />
                      <input
                        value={newModelData.id}
                        onChange={(e) => setNewModelData((d) => ({ ...d, id: e.target.value }))}
                        placeholder="模型 ID"
                        className={`${inputClass} !flex-1 !py-1`}
                      />
                      <button
                        onClick={() => handleAddModel(provider.id)}
                        className="px-2 py-1 rounded text-[10px] bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setNewModelProvider(null)}
                        className="px-2 py-1 rounded text-[10px] text-gray-500 hover:text-gray-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
        API Key 仅存储在浏览器本地，通过后端代理访问，不会直接暴露给前端请求。
      </p>
    </div>
  );
}
