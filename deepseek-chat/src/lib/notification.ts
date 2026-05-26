/**
 * Desktop Notification utility using the Notification API.
 * Requests permission on first call, shows notifications
 * when the AI response completes.
 */

let permission: NotificationPermission = 'default';

async function ensurePermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (permission === 'granted') return true;
  if (permission === 'denied') return false;
  const result = await Notification.requestPermission();
  permission = result;
  return result === 'granted';
}

export interface NotifyOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

/**
 * Show a desktop notification. Silently fails if denied or not supported.
 */
export async function notify(opts: NotifyOptions): Promise<boolean> {
  const ok = await ensurePermission();
  if (!ok) return false;
  try {
    new Notification(opts.title, {
      body: opts.body,
      icon: opts.icon ?? '/icon.svg',
      tag: opts.tag ?? 'deepseek-chat',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Notify that the AI has finished responding.
 */
export async function notifyResponseDone(title: string): Promise<boolean> {
  return notify({
    title: 'DeepSeek 回复完成',
    body: title ? `「${title}」的 AI 回复已生成` : 'AI 回复已生成',
    tag: 'response-done',
  });
}

/**
 * Notify about an error during streaming.
 */
export async function notifyError(error: string): Promise<boolean> {
  return notify({
    title: '回复出错',
    body: error || 'AI 请求失败，请重试',
    tag: 'response-error',
  });
}
