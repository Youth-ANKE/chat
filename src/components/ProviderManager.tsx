import { X, Plus, Eye, EyeOff, Key, Globe, Trash2, Info, CheckCircle, XCircle, Loader2, Search, Wifi } from 'lucide-react';
import { useState } from 'react';
import type { ModelProvider, ProviderModel } from '../types';
import { useProviderStore } from '../stores/providerStore';
import { testProviderConnection, fetchProviderModels } from '../lib/provider-test';

/** Friendly label for provider type */
function providerTypeLabel(type: string): string {
  const map: Record<string, string> = {
    deepseek: 'DeepSeek',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    ollama: 'Ollama',
    mimo: 'MiMo',
    custom: '自定义',
  };
  return map[type] ?? type;
}

/** Detect if running inside Electron */
const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.isElectron;

interface ProviderManagerProps {
  darkMode: boolean;
}

export function ProviderManager({ darkMode }: ProviderManagerProps) {
  const { providers, toggleProvider, setApiKey, setBaseUrl, addModel, removeModel, setModels } = useProviderStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newModelProvider, setNewModelProvider] = useState<string | null>(null);
  const [newModelData, setNewModelData] = useState({ id: '', name: '', maxTokens: 4096 });

  // ── 连接检测 / 模型拉取 状态 ──
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const [fetchedModels, setFetchedModels] = useState<Record<string, ProviderModel[]>>({});
  const [fetchError, setFetchError] = useState<Record<string, string>>({});
  const [selectedModelIds, setSelectedModelIds] = useState<Record<string, Set<string>>>({});

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

  /** 一键检测：先测连接，再拉模型列表 */
  const handleDetect = async (provider: ModelProvider) => {
    if (!provider.enabled) return;
    if (!provider.apiKey && provider.type !== 'ollama') return;

    setTestingId(provider.id);
    setTestResult((p) => ({ ...p, [provider.id]: undefined as any }));
    setFetchedModels((p) => { const n = { ...p }; delete n[provider.id]; return n; });
    setFetchError((p) => { const n = { ...p }; delete n[provider.id]; return n; });

    // Step 1: Test connection
    const conn = await testProviderConnection(provider);
    setTestingId(null);
    setTestResult((p) => ({ ...p, [provider.id]: { ok: conn.ok, message: conn.ok ? conn.message! : conn.error! } }));

    if (!conn.ok) return;

    // Step 2: Fetch models
    setFetchingId(provider.id);
    const result = await fetchProviderModels(provider);
    setFetchingId(null);

    if (result.ok && result.models.length > 0) {
      setFetchedModels((p) => ({ ...p, [provider.id]: result.models }));
      // Auto-select all fetched models by default
      setSelectedModelIds((p) => ({
        ...p,
        [provider.id]: new Set(result.models.map((m) => m.id)),
      }));
    } else {
      setFetchError((p) => ({ ...p, [provider.id]: result.error || '未获取到模型' }));
    }
  };

  /** 勾选/取消勾选单个模型 */
  const toggleModelSelect = (providerId: string, modelId: string) => {
    setSelectedModelIds((prev) => {
      const current = new Set(prev[providerId] || []);
      if (current.has(modelId)) current.delete(modelId);
      else current.add(modelId);
      return { ...prev, [providerId]: current };
    });
  };

  /** 保存勾选的模型到 provider */
  const saveSelectedModels = (providerId: string) => {
    const allModels = fetchedModels[providerId];
    if (!allModels) return;
    const selected = new Set(selectedModelIds[providerId] || []);
    const toSave = allModels.filter((m) => selected.has(m.id));
    if (toSave.length === 0) return;
    setModels(providerId, toSave);
    // Clear fetched state
    setFetchedModels((p) => { const n = { ...p }; delete n[providerId]; return n; });
    setSelectedModelIds((p) => { const n = { ...p }; delete n[providerId]; return n; });
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
                  {providerTypeLabel(provider.type)}
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

                {/* ── 一键检测按钮 ── */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDetect(provider)}
                    disabled={testingId === provider.id || fetchingId === provider.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      testingId === provider.id || fetchingId === provider.id
                        ? darkMode ? 'bg-white/[0.04] text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : darkMode ? 'bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 border border-cyan-500/20' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    {testingId === provider.id || fetchingId === provider.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Search className="w-3 h-3" />
                    )}
                    {testingId === provider.id ? '检测中...' : fetchingId === provider.id ? '拉取模型...' : '一键检测'}
                  </button>

                  {/* Connection test result chip */}
                  {testResult[provider.id] && (
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                      testResult[provider.id].ok
                        ? darkMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'
                        : darkMode ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50'
                    }`}>
                      {testResult[provider.id].ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {testResult[provider.id].message}
                    </span>
                  )}
                </div>

                {/* ── Fetched models with checkboxes ── */}
                {fetchedModels[provider.id] && fetchedModels[provider.id].length > 0 && (
                  <div className={`rounded-xl border p-3 ${
                    darkMode ? 'border-emerald-500/15 bg-emerald-500/[0.03]' : 'border-emerald-200 bg-emerald-50/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                        <Wifi className="w-3 h-3 inline mr-1" />
                        检测到 {fetchedModels[provider.id].length} 个模型，勾选需要使用的：
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                      {fetchedModels[provider.id].map((m) => {
                        const isSelected = selectedModelIds[provider.id]?.has(m.id) ?? true;
                        return (
                          <button
                            key={m.id}
                            onClick={() => toggleModelSelect(provider.id, m.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border transition-all ${
                              isSelected
                                ? darkMode
                                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                  : 'bg-indigo-100 text-indigo-700 border-indigo-300'
                                : darkMode
                                  ? 'bg-white/[0.02] text-gray-500 border-white/[0.04] line-through'
                                  : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
                            }`}
                          >
                            {m.id}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => saveSelectedModels(provider.id)}
                        disabled={(selectedModelIds[provider.id]?.size ?? 0) === 0}
                        className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                          darkMode
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-30 disabled:cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        保存选中模型
                      </button>
                      <button
                        onClick={() => {
                          setFetchedModels((p) => { const n = { ...p }; delete n[provider.id]; return n; });
                          setSelectedModelIds((p) => { const n = { ...p }; delete n[provider.id]; return n; });
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}

                {/* Fetch error */}
                {fetchError[provider.id] && (
                  <div className={`text-[10px] px-2 py-1 rounded-lg ${
                    darkMode ? 'text-red-400 bg-red-500/[0.06]' : 'text-red-600 bg-red-50'
                  }`}>
                    <XCircle className="w-3 h-3 inline mr-1" />
                    {fetchError[provider.id]}
                  </div>
                )}

                {/* Models */}
                <div>
                  <label className={labelClass}>当前模型列表</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {provider.models.map((m) => (
                      <span
                        key={m.id}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                          darkMode ? 'bg-white/[0.04] text-gray-400 border border-white/[0.06]' : 'bg-white text-gray-500 border border-gray-200'
                        }`}
                      >
                        {m.name}
                        <button
                          onClick={() => removeModel(provider.id, m.id)}
                          className="hover:text-red-400"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setNewModelProvider(provider.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${
                        darkMode ? 'text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10' : 'text-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <Plus className="w-2.5 h-2.5" />手动添加
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

      {isElectron ? (
        <div className={`flex items-start gap-2 p-3 rounded-xl text-[11px] leading-relaxed ${
          darkMode ? 'bg-cyan-500/[0.06] border border-cyan-500/15' : 'bg-indigo-50 border border-indigo-200'
        }`}>
          <Info className={`w-4 h-4 mt-0.5 shrink-0 ${darkMode ? 'text-cyan-400' : 'text-indigo-500'}`} />
          <div className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
            <p className="font-semibold mb-1">桌面版 API Key 配置说明</p>
            <p>
              桌面应用<strong>不经过云端代理</strong>，请求会直接从你的电脑发送到各 AI 服务商。
            </p>
            <p className="mt-1">
              请在对应服务商处填入正确的 <strong>API Key</strong> 和 <strong>Base URL</strong>（DeepSeek 已自动配置为 <code className={darkMode ? 'text-cyan-400' : 'text-indigo-600'}>https://api.deepseek.com</code>）。
            </p>
            <p className="mt-1">
              Key 仅存储在本地，不会上传到任何服务器。
            </p>
          </div>
        </div>
      ) : (
        <p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          API Key 仅存储在浏览器本地，通过后端代理访问，不会直接暴露给前端请求。
        </p>
      )}
    </div>
  );
}
