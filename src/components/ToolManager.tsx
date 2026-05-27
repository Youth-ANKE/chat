import { useState } from 'react';
import { X, Wrench, Plus, Trash2, ToggleLeft, ToggleRight, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import { useToolStore } from '../stores/toolStore';
import { useSettingsStore } from '../stores/settingsStore';
import { playClick, playDelete } from '../lib/sound';

interface ToolManagerProps {
  open: boolean;
  onClose: () => void;
}

export function ToolManager({ open, onClose }: ToolManagerProps) {
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const { tools, addTool, removeTool, toggleTool } = useToolStore();
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // New tool form
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSchema, setNewSchema] = useState(
    JSON.stringify({
      type: 'object',
      properties: {},
      required: [],
    }, null, 2)
  );
  const [newHandler, setNewHandler] = useState(
    '// 函数接收参数 args，返回字符串结果\n// 示例:\n// return JSON.stringify(args);'
  );

  if (!open) return null;

  const panelBg = darkMode
    ? 'backdrop-blur-[50px] saturate-[200%] bg-black/[0.28] border-l border-white/[0.06]'
    : 'backdrop-blur-[45px] saturate-[190%] brightness-[1.05] bg-white/[0.40] border-l border-gray-200/20';
  const cardBg = darkMode
    ? 'bg-white/[0.02] border border-white/[0.06]'
    : 'bg-gray-50 border border-gray-200';

  const handleAdd = () => {
    if (!newName.trim() || !newDesc.trim()) return;
    playClick();
    addTool({
      name: newName.trim(),
      description: newDesc.trim(),
      parameterSchema: newSchema,
      handlerCode: newHandler,
      enabled: true,
    });
    setNewName('');
    setNewDesc('');
    setNewSchema(JSON.stringify({ type: 'object', properties: {}, required: [] }, null, 2));
    setNewHandler('// 函数接收参数 args，返回字符串结果\n// 示例:\n// return JSON.stringify(args);');
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    playDelete();
    removeTool(id);
  };

  // Execute a tool's handler in a sandbox
  const handleTestRun = (tool: typeof tools[0]) => {
    try {
      let schema: Record<string, unknown>;
      try { schema = JSON.parse(tool.parameterSchema); } catch { schema = {}; }
      const props = (schema as { properties?: Record<string, { type: string }> }).properties || {};
      const args: Record<string, unknown> = {};
      for (const [key, prop] of Object.entries(props)) {
        const type = prop.type || 'string';
        if (type === 'number') args[key] = 0;
        else if (type === 'boolean') args[key] = false;
        else args[key] = '';
      }
      const fn = new Function('args', tool.handlerCode);
      const result = String(fn(args));
      alert(`测试结果:\n${result}`);
    } catch (e: unknown) {
      alert(`执行错误:\n${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className={`relative w-[420px] h-full overflow-y-auto custom-scrollbar shadow-2xl animate-slide-in-right ${panelBg}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b ${
          darkMode ? 'border-white/[0.06] backdrop-blur-[40px] saturate-[200%] bg-white/[0.03]' : 'border-gray-200/80 bg-white/80 backdrop-blur-xl'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'bg-gradient-to-br from-amber-100 to-orange-100'
            }`}>
              <Wrench className={`w-4 h-4 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <h2 className={`text-sm font-semibold ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>工具管理</h2>
              <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>自定义 Function Calling 工具</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Intro */}
          <div className={`p-3 rounded-xl text-xs ${darkMode ? 'bg-amber-500/[0.04] border border-amber-500/10 text-amber-400/70' : 'bg-amber-50 border border-amber-200 text-amber-600'}`}>
            工具（函数）会被发送给 AI 模型，AI 决定何时调用以及传递什么参数。适用于联网搜索、计算器、天气查询等场景。
          </div>

          {/* Add new */}
          {!showAdd ? (
            <button
              onClick={() => { playClick(); setShowAdd(true); }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all ${
                darkMode
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] text-cyan-400 border border-dashed border-cyan-500/20'
                  : 'bg-gray-50 hover:bg-gray-100 text-indigo-600 border border-dashed border-indigo-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> 添加新工具
            </button>
          ) : (
            <div className={`${cardBg} rounded-xl p-4 space-y-3`}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="工具名称 (英文)"
                className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${
                  darkMode ? 'bg-white/[0.03] border border-white/[0.08] text-white/90 placeholder-gray-600' : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400'
                }`}
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="工具描述 (给 AI 看的)"
                className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${
                  darkMode ? 'bg-white/[0.03] border border-white/[0.08] text-white/90 placeholder-gray-600' : 'bg-white border border-gray-200 text-gray-800 placeholder-gray-400'
                }`}
              />
              <div>
                <label className={`text-[10px] font-semibold mb-1 block ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>参数 JSON Schema</label>
                <textarea
                  value={newSchema}
                  onChange={(e) => setNewSchema(e.target.value)}
                  rows={6}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono outline-none ${
                    darkMode ? 'bg-white/[0.03] border border-white/[0.08] text-cyan-400' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                />
              </div>
              <div>
                <label className={`text-[10px] font-semibold mb-1 block ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>处理函数 (JavaScript)</label>
                <textarea
                  value={newHandler}
                  onChange={(e) => setNewHandler(e.target.value)}
                  rows={5}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-mono outline-none ${
                    darkMode ? 'bg-white/[0.03] border border-white/[0.08] text-emerald-400' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleAdd} disabled={!newName.trim() || !newDesc.trim()}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-30 ${
                    darkMode ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}>
                  添加
                </button>
                <button onClick={() => setShowAdd(false)}
                  className={`px-4 py-2 rounded-lg text-xs transition-all ${
                    darkMode ? 'hover:bg-white/[0.04] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}>
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Tool list */}
          {tools.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>暂无自定义工具</p>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className={`text-[11px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                已定义工具 ({tools.length})
              </h3>
              {tools.map((tool) => (
                <div key={tool.id} className={`${cardBg} rounded-xl overflow-hidden`}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <button onClick={() => toggleTool(tool.id)} className="flex-shrink-0">
                        {tool.enabled
                          ? <ToggleRight className={`w-5 h-5 ${darkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                          : <ToggleLeft className={`w-5 h-5 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                        }
                      </button>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-white/80' : 'text-gray-800'}`}>{tool.name}</p>
                        <p className={`text-[11px] truncate ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{tool.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTestRun(tool)}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-500 hover:text-cyan-400' : 'hover:bg-gray-100 text-gray-400 hover:text-indigo-500'}`}
                        title="测试运行"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === tool.id ? null : tool.id)}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}
                      >
                        {expanded === tool.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(tool.id)}
                        className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-500/10 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {expanded === tool.id && (
                    <div className={`px-4 pb-4 space-y-2 border-t ${darkMode ? 'border-white/[0.04]' : 'border-gray-200'}`}>
                      <div className="pt-3">
                        <label className={`text-[10px] font-semibold block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Schema</label>
                        <pre className={`text-[10px] p-2 rounded-lg overflow-x-auto ${
                          darkMode ? 'bg-black/20 text-cyan-400/80' : 'bg-gray-100 text-gray-600'
                        }`}>{tool.parameterSchema}</pre>
                      </div>
                      <div>
                        <label className={`text-[10px] font-semibold block mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Handler</label>
                        <pre className={`text-[10px] p-2 rounded-lg overflow-x-auto ${
                          darkMode ? 'bg-black/20 text-emerald-400/80' : 'bg-gray-100 text-gray-600'
                        }`}>{tool.handlerCode}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`px-5 py-3 border-t ${darkMode ? 'border-white/[0.04]' : 'border-gray-200'}`}>
          <p className={`text-[10px] text-center ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
            工具管理 · Function Calling
          </p>
        </div>
      </div>
    </div>
  );
}
