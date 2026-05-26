import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface BookmarkedMessage {
  message: ChatMessage;
  sessionId: string;
  sessionTitle: string;
  bookmarkedAt: string;
}

interface BookmarkState {
  bookmarks: BookmarkedMessage[];
  addBookmark: (message: ChatMessage, sessionId: string, sessionTitle: string) => void;
  removeBookmark: (messageId: string) => void;
  isBookmarked: (messageId: string) => boolean;
  getBookmarks: () => BookmarkedMessage[];
  clearAll: () => void;
}

const STORAGE_KEY = 'deepseek_bookmarks';

function loadBookmarks(): BookmarkedMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveBookmarks(bookmarks: BookmarkedMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: loadBookmarks(),

  addBookmark: (message, sessionId, sessionTitle) => {
    set((state) => {
      const exists = state.bookmarks.find((b) => b.message.id === message.id);
      if (exists) {
        const filtered = state.bookmarks.filter((b) => b.message.id !== message.id);
        saveBookmarks(filtered);
        return { bookmarks: filtered };
      }
      const updated = [...state.bookmarks, { message, sessionId, sessionTitle, bookmarkedAt: new Date().toISOString() }];
      saveBookmarks(updated);
      return { bookmarks: updated };
    });
  },

  removeBookmark: (messageId) => {
    set((state) => {
      const updated = state.bookmarks.filter((b) => b.message.id !== messageId);
      saveBookmarks(updated);
      return { bookmarks: updated };
    });
  },

  isBookmarked: (messageId) => get().bookmarks.some((b) => b.message.id === messageId),

  getBookmarks: () => get().bookmarks,

  clearAll: () => {
    saveBookmarks([]);
    set({ bookmarks: [] });
  },
}));
