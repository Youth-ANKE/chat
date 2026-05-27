import { useState, useMemo } from 'react';
import {
  X, BarChart3, Zap, Coins, MessageSquare, TrendingUp,
  Trash2, Clock, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { useUsageStore } from '../stores/usageStore';
import { useSettingsStore } from '../stores/settingsStore';
import { DEFAULT_PRICING, calculateCost } from '../types';
import type { ModelName, UsageRecord } from '../types';
import { playClick, playDelete } from '../lib/sound';

interface UsagePanelProps {
  open: boolean;
  onClose: () => void;
}

// ── Helpers ──

function fmt(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(Math.round(num));
}

function fmtMoney(rmb: number): string {
  if (rmb < 0.01) return '< ¥0.01';
  return `¥${rmb.toFixed(2)}`;
}

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  } catch {
    return iso;
  }
}

const MODEL_COLORS: Record<string, { stroke: string; fill: string; hex: string }> = {
  'deepseek-v4-flash': { stroke: '#22d3ee', fill: '#22d3ee', hex: '#22d3ee' },
  'deepseek-v4-pro':   { stroke: '#c084fc', fill: '#c084fc', hex: '#c084fc' },
};

// ── Donut Chart Component ──

function DonutChart({ byModel }: { byModel: Record<string, { totalTokens: number }> }) {
  const total = Object.values(byModel).reduce((s, m) => s + m.totalTokens, 0);
  if (total === 0) return <EmptyChart text="暂无使用数据" />;

  const entries = Object.entries(byModel).map(([model, data]) => ({
    model,
    tokens: data.totalTokens,
    color: MODEL_COLORS[model]?.hex ?? '#6b7280',
  }));

  // Build SVG dasharray segments
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = entries.map((e) => {
    const ratio = e.tokens / total;
    const dash = circumference * ratio;
    const seg = { ...e, dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#ffffff10" strokeWidth="12" />
        {segments.map((seg, i) => (
          <circle
            key={seg.model}
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={seg.color}
            strokeWidth="12"
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
          />
        ))}
        <text x="60" y="57" textAnchor="middle" className="fill-white text-sm font-bold">
          {fmt(total)}
        </text>
        <text x="60" y="73" textAnchor="middle" className="fill-gray-500 text-[9px]">
          Tokens
        </text>
      </svg>
      <div className="space-y-1.5 text-xs">
        {segments.map((s) => (
          <div key={s.model} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-gray-300">{DEFAULT_PRICING[s.model as ModelName]?.label ?? s.model}</span>
            <span className="text-gray-500 tabular-nums">{((s.tokens / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart (Input vs Output) Component ──

function TokensBarChart({ byModel }: { byModel: Record<string, { inputTokens: number; outputTokens: number }> }) {
  const entries = Object.entries(byModel);
  const allModels = entries.length;
  if (allModels === 0) return <EmptyChart text="暂无使用数据" />;

  const maxTokens = Math.max(
    ...entries.flatMap(([, d]) => [d.inputTokens, d.outputTokens]),
    1
  );

  const barHeight = 120;
  const barWidth = 32;
  const gap = 48;
  const totalWidth = allModels * (barWidth * 2 + gap) + 40;

  return (
    <svg width={totalWidth} height={barHeight + 30} viewBox={`0 0 ${totalWidth} ${barHeight + 30}`}>
      {entries.map(([model, data], mi) => {
        const color = MODEL_COLORS[model] ?? { stroke: '#6b7280', fill: '#6b7280' };
        const x0 = 20 + mi * (barWidth * 2 + gap);
        const inputH = (data.inputTokens / maxTokens) * barHeight;
        const outputH = (data.outputTokens / maxTokens) * barHeight;

        return (
          <g key={model}>
            {/* Input bar */}
            <rect x={x0} y={barHeight - inputH} width={barWidth} height={inputH} rx="3"
              fill={color.hex} opacity="0.55" />
            <text x={x0 + barWidth / 2} y={barHeight - inputH - 6} textAnchor="middle"
              className="fill-gray-400" fontSize="9">{fmt(data.inputTokens)}</text>

            {/* Output bar */}
            <rect x={x0 + barWidth + 4} y={barHeight - outputH} width={barWidth} height={outputH} rx="3"
              fill={color.hex} />
            <text x={x0 + barWidth + 4 + barWidth / 2} y={barHeight - outputH - 6} textAnchor="middle"
              className="fill-gray-400" fontSize="9">{fmt(data.outputTokens)}</text>

            {/* Labels */}
            <text x={x0 + barWidth + 2} y={barHeight + 16} textAnchor="middle"
              className="fill-gray-400" fontSize="9">输入</text>
            <text x={x0 + barWidth + 2} y={barHeight + 28} textAnchor="middle"
              className="fill-gray-400" fontSize="9">输出</text>

            {/* Model name at bottom */}
            <text x={x0 + barWidth + 2} y={barHeight + 46} textAnchor="middle"
              className="fill-gray-300" fontSize="10" fontWeight="600">
              {DEFAULT_PRICING[model as ModelName]?.label ?? model}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Sparkline Component ──

function Sparkline({ byDay }: { byDay: { tokens: number }[] }) {
  const values = byDay.map((d) => d.tokens);
  if (values.length < 2) return <EmptyChart text="需要更多数据" />;

  const max = Math.max(...values, 1);
  const w = 280;
  const h = 48;
  const pad = 4;
  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = h - pad - (v / max) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="flex-shrink-0">
      {/* Area fill */}
      <polygon
        points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
        fill="url(#sparkFill)"
        opacity="0.4"
      />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinejoin="round" />
      {/* Dots */}
      {values.map((v, i) => {
        const x = pad + (i / (values.length - 1)) * (w - pad * 2);
        const y = h - pad - (v / max) * (h - pad * 2);
        return <circle key={i} cx={x} cy={y} r="1.5" fill="#22d3ee" />;
      })}
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10">
      <span className="text-xs text-gray-600">{text}</span>
    </div>
  );
}

// ── Main Panel ──

export function UsagePanel({ open, onClose }: UsagePanelProps) {
  const { records, clearAll, getSummary } = useUsageStore();
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const [showTable, setShowTable] = useState(false);

  const summary = useMemo(() => getSummary(), [records]);

  if (!open) return null;

  const modelEntries = Object.entries(summary.byModel);
  const mostUsedModel = modelEntries.length > 0
    ? modelEntries.reduce((a, b) => a[1].totalTokens > b[1].totalTokens ? a : b)
    : null;

  const panelBg = darkMode
    ? 'backdrop-blur-[50px] saturate-[200%] bg-black/[0.28] border-l border-white/[0.06]'
    : 'backdrop-blur-[45px] saturate-[190%] brightness-[1.05] bg-white/[0.40] border-l border-gray-200/20';
  const cardBg = darkMode
    ? 'bg-white/[0.02] border border-white/[0.06] rounded-xl'
    : 'bg-gray-50 border border-gray-200 rounded-xl';
  const sectionTitle = darkMode ? 'text-gray-400 text-[11px] font-semibold uppercase tracking-wider' : 'text-gray-500 text-[11px] font-semibold uppercase tracking-wider';
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className={`relative w-[380px] h-full overflow-y-auto custom-scrollbar shadow-2xl animate-slide-in-right ${panelBg}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b ${
          darkMode ? 'backdrop-blur-[40px] saturate-[200%] bg-black/[0.25] border-white/[0.06]' : 'backdrop-blur-[40px] saturate-[190%] brightness-[1.05] bg-white/[0.45] border-gray-200/20'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              darkMode ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20' : 'bg-gradient-to-br from-cyan-100 to-purple-100'
            }`}>
              <BarChart3 className={`w-4 h-4 ${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <h2 className={`text-sm font-semibold ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>用量统计</h2>
              <p className={`text-[10px] ${textMuted}`}>API 消耗与费用分析</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {records.length > 0 && (
              <button
                onClick={() => { if (confirm('确定要清空所有用量记录？')) { playDelete(); clearAll(); } }}
                className={`p-1.5 rounded-lg transition-colors ${
                  darkMode ? 'hover:bg-red-500/10 text-gray-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                }`}
                title="清空记录"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* ── Summary Cards ── */}
          <div>
            <h3 className={`${sectionTitle} mb-3`}>概览</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Card icon={<Zap className="w-3.5 h-3.5" />} label="API 调用次数" value={summary.totalCalls.toLocaleString()}
                color="cyan" darkMode={darkMode} />
              <Card icon={<Coins className="w-3.5 h-3.5" />} label="总花费" value={fmtMoney(summary.totalCostRMB)}
                color="amber" darkMode={darkMode} />
              <Card icon={<BarChart3 className="w-3.5 h-3.5" />} label="总 Token" value={fmt(summary.totalTokens)}
                color="purple" darkMode={darkMode} />
              <Card icon={<Sparkles className="w-3.5 h-3.5" />} label="常用模型"
                value={mostUsedModel ? DEFAULT_PRICING[mostUsedModel[0] as ModelName]?.label ?? mostUsedModel[0] : '-'}
                color="emerald" darkMode={darkMode} />
            </div>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                darkMode ? 'bg-white/[0.02] border border-white/[0.05]' : 'bg-gray-100'
              }`}>
                <BarChart3 className={`w-7 h-7 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
              </div>
              <p className={`text-sm font-medium mb-1.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                暂无用量数据
              </p>
              <p className={`text-xs leading-relaxed max-w-[240px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                发送消息后将自动统计每次 API 调用的 Token 消耗和费用。
              </p>
            </div>
          ) : (
            <>
              {/* ── Token 消耗趋势 (Sparkline) ── */}
              {summary.byDay.length >= 2 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className={`w-3.5 h-3.5 ${darkMode ? 'text-cyan-400' : 'text-cyan-500'}`} />
                    <h3 className={sectionTitle}>消耗趋势 (14天)</h3>
                  </div>
                  <div className={`${cardBg} p-3 flex justify-center`}>
                    <Sparkline byDay={summary.byDay} />
                  </div>
                </div>
              )}

              {/* ── 模型分布 ── */}
              <div>
                <h3 className={`${sectionTitle} mb-3`}>模型分布</h3>
                <div className={`${cardBg} p-4`}>
                  <DonutChart byModel={summary.byModel} />
                </div>
              </div>

              {/* ── 输入 / 输出 Token 对比 ── */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className={`w-3.5 h-3.5 ${darkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                  <h3 className={sectionTitle}>输入 vs 输出 Token</h3>
                </div>
                <div className={`${cardBg} p-4 overflow-x-auto custom-scrollbar`}>
                  <TokensBarChart byModel={summary.byModel} />
                </div>
              </div>

              {/* ── 模型价格表 ── */}
              <div>
                <h3 className={`${sectionTitle} mb-3`}>模型价格</h3>
                <div className={`${cardBg} p-3`}>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                        <th className="text-left py-1.5 font-medium">模型</th>
                        <th className="text-right py-1.5 font-medium">输入 (每M)</th>
                        <th className="text-right py-1.5 font-medium">输出 (每M)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(DEFAULT_PRICING).map(([key, p]) => (
                        <tr key={key} className={darkMode ? 'border-t border-white/[0.04]' : 'border-t border-gray-200'}>
                          <td className={`py-2 font-medium ${darkMode ? 'text-white/80' : 'text-gray-800'}`}>{p.label}</td>
                          <td className="py-2 text-right tabular-nums text-cyan-400">¥{p.inputPerMillion}</td>
                          <td className="py-2 text-right tabular-nums text-purple-400">¥{p.outputPerMillion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 最近调用记录 ── */}
              <div>
                <button
                  onClick={() => { playClick(); setShowTable(!showTable); }}
                  className="flex items-center gap-2 w-full mb-3"
                >
                  <Clock className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <h3 className={sectionTitle}>最近记录 ({summary.recentRecords.length})</h3>
                  <div className="ml-auto">
                    {showTable
                      ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
                      : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    }
                  </div>
                </button>
                {showTable && (
                  <div className={`${cardBg} overflow-hidden`}>
                    <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-xs">
                        <thead className={`sticky top-0 z-[1] ${darkMode ? 'bg-white/[0.03] backdrop-blur-[20px]' : 'bg-white'}`}>
                          <tr className={darkMode ? 'text-gray-500' : 'text-gray-400'}>
                            <th className="text-left px-3 py-2 font-medium">时间</th>
                            <th className="text-left px-3 py-2 font-medium">会话</th>
                            <th className="text-left px-3 py-2 font-medium">模型</th>
                            <th className="text-right px-3 py-2 font-medium">输入</th>
                            <th className="text-right px-3 py-2 font-medium">输出</th>
                            <th className="text-right px-3 py-2 font-medium">费用</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.recentRecords.map((r) => (
                            <tr key={r.id} className={darkMode ? 'border-t border-white/[0.04] hover:bg-white/[0.02]' : 'border-t border-gray-100 hover:bg-gray-50'}>
                              <td className={`px-3 py-2 tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{fmtDate(r.timestamp)}</td>
                              <td className={`px-3 py-2 ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
                                <span className="truncate max-w-[70px] inline-block">{r.sessionTitle}</span>
                              </td>
                              <td className="px-3 py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  r.model === 'deepseek-v4-pro'
                                    ? darkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'
                                    : darkMode ? 'bg-cyan-500/10 text-cyan-400' : 'bg-cyan-50 text-cyan-600'
                                }`}>
                                  {DEFAULT_PRICING[r.model]?.label ?? r.model}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-gray-400">{fmt(r.inputTokens)}</td>
                              <td className="px-3 py-2 text-right tabular-nums text-gray-400">{fmt(r.outputTokens)}</td>
                              <td className={`px-3 py-2 text-right tabular-nums font-mono ${darkMode ? 'text-amber-400/80' : 'text-amber-600'}`}>
                                {fmtMoney(r.costRMB)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className={`pt-3 border-t ${darkMode ? 'border-white/[0.04]' : 'border-gray-200'}`}>
            <p className={`text-[10px] text-center ${darkMode ? 'text-gray-700' : 'text-gray-400'}`}>
              DeepSeek Chatbox · Usage Analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Summary Card sub-component ──

function Card({
  icon, label, value, color, darkMode,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'amber' | 'purple' | 'emerald';
  darkMode: boolean;
}) {
  const colorMap = {
    cyan:    darkMode ? 'text-cyan-400 bg-cyan-500/10' : 'text-cyan-600 bg-cyan-50',
    amber:   darkMode ? 'text-amber-400 bg-amber-500/10' : 'text-amber-600 bg-amber-50',
    purple:  darkMode ? 'text-purple-400 bg-purple-500/10' : 'text-purple-600 bg-purple-50',
    emerald: darkMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50',
  };

  return (
    <div className={`p-3 rounded-xl ${darkMode ? 'bg-white/[0.02] border border-white/[0.06]' : 'bg-gray-50 border border-gray-200'}`}>
      <div className="flex items-center gap-1.5 mb-2">
        <span className={`p-1 rounded ${colorMap[color]}`}>{icon}</span>
        <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</span>
      </div>
      <p className={`text-lg font-bold tabular-nums ${darkMode ? 'text-white/90' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
