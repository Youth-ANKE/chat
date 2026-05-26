import { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { ToolCall } from '../types';
import { useSettingsStore } from '../stores/settingsStore';

interface ToolCallCardProps {
  calls: ToolCall[];
}

export function ToolCallCard({ calls }: ToolCallCardProps) {
  const darkMode = useSettingsStore((s) => s.settings.darkMode);
  const [expanded, setExpanded] = useState<string | null>(null);

  const statusIcon = (status: ToolCall['status']) => {
    switch (status) {
      case 'running': return <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />;
      case 'done': return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case 'error': return <XCircle className="w-3 h-3 text-red-400" />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-500" />;
    }
  };

  return (
    <div className={`mb-3 space-y-1.5 ${darkMode ? '' : ''}`}>
      {calls.map((call) => (
        <div
          key={call.id}
          className={`rounded-lg overflow-hidden border ${
            darkMode ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-gray-50 border-gray-200'
          }`}
        >
          <button
            onClick={() => setExpanded(expanded === call.id ? null : call.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${
              darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-100'
            }`}
          >
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span className={`truncate ${darkMode ? 'text-white/70' : 'text-gray-600'}`}>
              {call.name}
              {call.status === 'running' && '...'}
            </span>
            <span className="ml-auto">{statusIcon(call.status)}</span>
            {expanded === call.id
              ? <ChevronUp className="w-3 h-3 text-gray-500" />
              : <ChevronDown className="w-3 h-3 text-gray-500" />
            }
          </button>
          {expanded === call.id && (
            <div className={`px-3 pb-3 text-xs font-mono space-y-1.5 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div>
                <div className="text-[10px] uppercase opacity-50 mb-0.5">Arguments</div>
                <div className={`p-2 rounded ${darkMode ? 'bg-black/20' : 'bg-gray-100'}`}>
                  {JSON.stringify(call.arguments, null, 2)}
                </div>
              </div>
              {call.result && (
                <div>
                  <div className="text-[10px] uppercase opacity-50 mb-0.5">Result</div>
                  <div className={`p-2 rounded ${darkMode ? 'bg-black/20' : 'bg-gray-100'}`}>
                    {call.result}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
