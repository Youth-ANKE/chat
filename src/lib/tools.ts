import { useState, useCallback } from 'react';
import type { ToolCall, ToolDefinition } from '../types';

const BUILTIN_TOOLS: ToolDefinition[] = [
  {
    name: 'calculator',
    description: 'Evaluate a mathematical expression',
    parameters: {
      type: 'object',
      properties: { expression: { type: 'string', description: 'The mathematical expression to evaluate' } },
      required: ['expression'],
    },
  },
  {
    name: 'get_current_time',
    description: 'Get the current time',
    parameters: {
      type: 'object',
      properties: { timezone: { type: 'string', description: 'IANA timezone, e.g. Asia/Shanghai' } },
      required: [],
    },
  },
];

function executeTool(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'calculator':
      try {
        const result = Function(`"use strict"; return (${args.expression})`)();
        return String(result);
      } catch (e) {
        return `Error: ${(e as Error).message}`;
      }
    case 'get_current_time':
      return new Date().toISOString();
    default:
      return `Unknown tool: ${name}`;
  }
}

export function useToolCalling() {
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  const getToolDefinitions = useCallback((): ToolDefinition[] => {
    return BUILTIN_TOOLS;
  }, []);

  const executeToolCalls = useCallback(async (calls: { id: string; function: { name: string; arguments: string } }[]): Promise<ToolCall[]> => {
    setIsExecuting(true);
    const results: ToolCall[] = [];

    for (const call of calls) {
      let parsedArgs: Record<string, unknown> = {};
      try { parsedArgs = JSON.parse(call.function.arguments); } catch { /* keep empty */ }

      const tc: ToolCall = {
        id: call.id,
        name: call.function.name,
        arguments: parsedArgs,
        status: 'running',
      };
      setToolCalls((prev) => [...prev, tc]);

      try {
        const result = executeTool(call.function.name, parsedArgs);
        tc.status = 'done';
        tc.result = result;
      } catch (e) {
        tc.status = 'error';
        tc.result = `Error: ${(e as Error).message}`;
      }

      results.push(tc);
      setToolCalls((prev) => prev.map((t) => (t.id === tc.id ? tc : t)));
    }

    setIsExecuting(false);
    return results;
  }, []);

  const clearToolCalls = useCallback(() => setToolCalls([]), []);

  return { toolCalls, isExecuting, getToolDefinitions, executeToolCalls, clearToolCalls };
}
