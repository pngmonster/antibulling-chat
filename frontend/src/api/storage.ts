/**
 * Хранение анонимного токена.
 *
 * По умолчанию используем sessionStorage: если ребёнок сидит за общим
 * компьютером, после закрытия вкладки от разговора не останется следа.
 * Переключить на постоянное хранение можно осознанно, кнопкой в интерфейсе.
 */

const KEY = 'ryadom.session';
const MODE_KEY = 'ryadom.persist';

export type StorageMode = 'session' | 'device';

function safe(storage: Storage | undefined): Storage | null {
  try {
    if (!storage) return null;
    const probe = '__probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

const local = safe(typeof window !== 'undefined' ? window.localStorage : undefined);
const session = safe(typeof window !== 'undefined' ? window.sessionStorage : undefined);

export function getMode(): StorageMode {
  return local?.getItem(MODE_KEY) === 'device' ? 'device' : 'session';
}

export function readToken(): string | null {
  return session?.getItem(KEY) ?? local?.getItem(KEY) ?? null;
}

export function writeToken(token: string): void {
  if (getMode() === 'device') local?.setItem(KEY, token);
  session?.setItem(KEY, token);
}

export function setMode(mode: StorageMode): void {
  local?.setItem(MODE_KEY, mode);
  const token = readToken();
  if (mode === 'device' && token) local?.setItem(KEY, token);
  if (mode === 'session') local?.removeItem(KEY);
}

export function clearAll(): void {
  local?.removeItem(KEY);
  local?.removeItem(MODE_KEY);
  session?.removeItem(KEY);
}
