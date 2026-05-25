import { create } from 'zustand';
import type { UsageRecord, ModelName, APITokenUsage } from '../types';
import { calculateCost } from '../types';

const STORAGE_KEY = 'deepseek_usage_records';

function loadRecords(): UsageRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: UsageRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage full — silently ignore
  }
}

interface UsageState {
  records: UsageRecord[];
  addRecord: (params: {
    sessionId: string;
    sessionTitle: string;
    model: ModelName;
    usage: APITokenUsage;
  }) => void;
  clearAll: () => void;
  // Computed helpers (read-only from state)
  getSummary: () => {
    totalCalls: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostRMB: number;
    byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; costRMB: number }>;
    byDay: { date: string; calls: number; tokens: number; costRMB: number }[];
    recentRecords: UsageRecord[];
  };
}

function idGen(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useUsageStore = create<UsageState>((set, get) => ({
  records: loadRecords(),

  addRecord: ({ sessionId, sessionTitle, model, usage }) => {
    const record: UsageRecord = {
      id: idGen(),
      sessionId,
      sessionTitle,
      model,
      timestamp: new Date().toISOString(),
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      costRMB: calculateCost(model, usage.prompt_tokens, usage.completion_tokens),
    };
    const updated = [record, ...get().records];
    set({ records: updated });
    saveRecords(updated);
  },

  clearAll: () => {
    set({ records: [] });
    saveRecords([]);
  },

  getSummary: () => {
    const { records } = get();
    const byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number; totalTokens: number; costRMB: number }> = {};
    const dayMap: Record<string, { calls: number; tokens: number; costRMB: number }> = {};

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalCostRMB = 0;

    for (const r of records) {
      totalInputTokens += r.inputTokens;
      totalOutputTokens += r.outputTokens;
      totalTokens += r.totalTokens;
      totalCostRMB += r.costRMB;

      // Per-model
      if (!byModel[r.model]) {
        byModel[r.model] = { calls: 0, inputTokens: 0, outputTokens: 0, totalTokens: 0, costRMB: 0 };
      }
      byModel[r.model].calls++;
      byModel[r.model].inputTokens += r.inputTokens;
      byModel[r.model].outputTokens += r.outputTokens;
      byModel[r.model].totalTokens += r.totalTokens;
      byModel[r.model].costRMB += r.costRMB;

      // Per-day (last 14 days)
      const dateKey = r.timestamp.slice(0, 10);
      if (!dayMap[dateKey]) {
        dayMap[dateKey] = { calls: 0, tokens: 0, costRMB: 0 };
      }
      dayMap[dateKey].calls++;
      dayMap[dateKey].tokens += r.totalTokens;
      dayMap[dateKey].costRMB += r.costRMB;
    }

    // Sort byDay descending
    const byDay = Object.entries(dayMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14)
      .map(([date, data]) => ({ date, ...data }))
      .reverse();

    return {
      totalCalls: records.length,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      totalCostRMB: Math.round(totalCostRMB * 10000) / 10000,
      byModel,
      byDay,
      recentRecords: records.slice(0, 50),
    };
  },
}));
