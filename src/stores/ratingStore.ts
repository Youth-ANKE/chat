import { create } from 'zustand';

export interface MessageRating {
  messageId: string;
  sessionId: string;
  rating: 'up' | 'down';
  timestamp: string;
}

interface RatingState {
  ratings: MessageRating[];
  /** Rate a message (toggles: same rating → remove, different rating → switch) */
  rateMessage: (messageId: string, sessionId: string, rating: 'up' | 'down') => void;
  /** Get rating for a specific message */
  getRating: (messageId: string) => MessageRating | undefined;
  /** Remove rating */
  clearRating: (messageId: string) => void;
}

const STORAGE_KEY = 'deepseek_ratings';

function loadRatings(): MessageRating[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistRatings(ratings: MessageRating[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  } catch { /* quota exceeded */ }
}

export const useRatingStore = create<RatingState>((set, get) => ({
  ratings: loadRatings(),

  rateMessage: (messageId, sessionId, rating) => {
    set((state) => {
      const existing = state.ratings.find((r) => r.messageId === messageId);
      let next: MessageRating[];
      if (existing) {
        if (existing.rating === rating) {
          // Same rating → remove
          next = state.ratings.filter((r) => r.messageId !== messageId);
        } else {
          // Different rating → switch
          next = state.ratings.map((r) =>
            r.messageId === messageId
              ? { ...r, rating, timestamp: new Date().toISOString() }
              : r
          );
        }
      } else {
        next = [
          ...state.ratings,
          { messageId, sessionId, rating, timestamp: new Date().toISOString() },
        ];
      }
      persistRatings(next);
      return { ratings: next };
    });
  },

  getRating: (messageId) => {
    return get().ratings.find((r) => r.messageId === messageId);
  },

  clearRating: (messageId) => {
    set((state) => {
      const next = state.ratings.filter((r) => r.messageId !== messageId);
      persistRatings(next);
      return { ratings: next };
    });
  },
}));
