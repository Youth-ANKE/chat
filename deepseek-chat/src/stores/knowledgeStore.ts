import { create } from 'zustand';
import type { KnowledgeDocument, KnowledgeChunk } from '../types';
import { nanoid } from 'nanoid';

interface KnowledgeState {
  documents: KnowledgeDocument[];
  addDocument: (name: string, type: KnowledgeDocument['type'], content: string) => void;
  removeDocument: (id: string) => void;
  searchChunks: (query: string, topK?: number) => string[];
  clearAll: () => void;
}

const STORAGE_KEY = 'deepseek_knowledge';

function chunkText(text: string, chunkSize = 400): string[] {
  const sentences = text.split(/(?<=[。！？.!?\n])/);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > chunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function loadDocuments(): KnowledgeDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDocuments(docs: KnowledgeDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// Simple keyword-based search (TF-IDF like)
function searchChunks(query: string, chunks: KnowledgeChunk[], topK = 3): string[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = chunks.map((chunk) => {
    const lower = chunk.content.toLowerCase();
    let score = 0;
    for (const term of terms) {
      const count = (lower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += count;
    }
    // Bonus for exact phrase match
    if (lower.includes(query.toLowerCase())) score += 5;
    return { chunk, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.chunk.content);
}

export const useKnowledgeStore = create<KnowledgeState>((set, get) => ({
  documents: loadDocuments(),

  addDocument: (name, type, content) => {
    const chunks = chunkText(content).map((c) => ({
      id: nanoid(),
      content: c,
    }));

    const doc: KnowledgeDocument = {
      id: nanoid(),
      name,
      type,
      chunks,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const updated = [...state.documents, doc];
      saveDocuments(updated);
      return { documents: updated };
    });
  },

  removeDocument: (id) => {
    set((state) => {
      const updated = state.documents.filter((d) => d.id !== id);
      saveDocuments(updated);
      return { documents: updated };
    });
  },

  searchChunks: (query, topK = 3) => {
    const allChunks = get().documents.flatMap((d) => d.chunks);
    return searchChunks(query, allChunks, topK);
  },

  clearAll: () => {
    saveDocuments([]);
    set({ documents: [] });
  },
}));
