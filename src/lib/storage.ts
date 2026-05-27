import { get, set, del, keys } from 'idb-keyval';
import type { ChatSession } from '../types';

const SESSION_PREFIX = 'cs_';

export async function loadSessions(): Promise<ChatSession[]> {
  try {
    const allKeys = await keys();
    const sessionKeys = allKeys.filter((k) =>
      String(k).startsWith(SESSION_PREFIX)
    );
    const sessions: ChatSession[] = [];
    for (const key of sessionKeys) {
      const data = await get<ChatSession>(key);
      if (data) sessions.push(data);
    }
    return sessions.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export async function saveSession(session: ChatSession): Promise<void> {
  try {
    await set(SESSION_PREFIX + session.id, { ...session, updatedAt: new Date().toISOString() });
  } catch {
    // IndexedDB write failed silently – data stays in-memory
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    await del(SESSION_PREFIX + id);
  } catch {
    // ignore
  }
}
