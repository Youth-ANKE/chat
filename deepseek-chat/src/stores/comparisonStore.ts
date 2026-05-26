import { create } from 'zustand';
import type { ComparisonSession } from '../types';
import { nanoid } from 'nanoid';

interface ComparisonState {
  sessions: ComparisonSession[];
  activeId: string | null;
  addSession: (session: Omit<ComparisonSession, 'id' | 'leftContent' | 'rightContent' | 'leftStatus' | 'rightStatus'>) => string;
  updateContent: (id: string, side: 'left' | 'right', content: string) => void;
  updateReasoning: (id: string, side: 'left' | 'right', reasoning: string) => void;
  setStatus: (id: string, side: 'left' | 'right', status: ComparisonSession['leftStatus']) => void;
  removeSession: (id: string) => void;
  getActive: () => ComparisonSession | undefined;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  sessions: [],
  activeId: null,

  addSession: (data) => {
    const id = nanoid();
    const session: ComparisonSession = {
      ...data,
      id,
      leftContent: '',
      rightContent: '',
      leftStatus: 'idle',
      rightStatus: 'idle',
    };
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeId: id,
    }));
    return id;
  },

  updateContent: (id, side, content) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id
          ? { ...s, [side === 'left' ? 'leftContent' : 'rightContent']: content }
          : s
      ),
    })),

  updateReasoning: (id, side, reasoning) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id
          ? { ...s, [side === 'left' ? 'leftReasoning' : 'rightReasoning']: reasoning }
          : s
      ),
    })),

  setStatus: (id, side, status) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id
          ? { ...s, [side === 'left' ? 'leftStatus' : 'rightStatus']: status }
          : s
      ),
    })),

  removeSession: (id) =>
    set((state) => {
      const next = state.sessions.filter((s) => s.id !== id);
      return {
        sessions: next,
        activeId: state.activeId === id ? (next[0]?.id ?? null) : state.activeId,
      };
    }),

  getActive: () => {
    const { sessions, activeId } = get();
    return sessions.find((s) => s.id === activeId);
  },
}));
