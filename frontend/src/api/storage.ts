/**
 * Хранение анонимного токена.
 *
 * По умолчанию разговор помнится на устройстве: ребёнок может закрыть вкладку,
 * выключить телефон и вернуться к тому же психологу и той же переписке.
 *
 * Обратная сторона — переписку на общем устройстве может увидеть посторонний.
 * Поэтому срок жизни ограничен, режим отключается одним переключателем,
 * а удалить всё можно в любой момент.
 */

const KEY = 'ryadom.session';
const MODE_KEY = 'ryadom.persist';
const TOUCHED_KEY = 'ryadom.touched';

/** Через столько дней без единого захода токен считается протухшим. */
const TTL_DAYS = 30;
const TTL_MS = TTL_DAYS * 24 * 60 * 60 * 1000;

export type StorageMode = 'device' | 'session';

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

/** Режим по умолчанию — помнить. Выключается осознанно в блоке «Приватность». */
export function getMode(): StorageMode {
  return local?.getItem(MODE_KEY) === 'session' ? 'session' : 'device';
}

function expired(): boolean {
  const touched = Number(local?.getItem(TOUCHED_KEY) ?? 0);
  return touched > 0 && Date.now() - touched > TTL_MS;
}

export function readToken(): string | null {
  if (expired()) {
    clearAll();
    return null;
  }

  const token = session?.getItem(KEY) ?? local?.getItem(KEY) ?? null;

  if (token) {
    // Отсчёт срока идёт от последнего захода, а не от создания диалога.
    if (getMode() === 'device') local?.setItem(TOUCHED_KEY, String(Date.now()));
    // Держим копию в обоих хранилищах: вкладка продолжит работать,
    // даже если режим «помнить» выключат прямо сейчас.
    session?.setItem(KEY, token);
  }

  return token;
}

export function writeToken(token: string): void {
  session?.setItem(KEY, token);
  if (getMode() === 'device') {
    local?.setItem(KEY, token);
    local?.setItem(TOUCHED_KEY, String(Date.now()));
  }
}

export function setMode(mode: StorageMode): void {
  local?.setItem(MODE_KEY, mode);
  const token = session?.getItem(KEY) ?? local?.getItem(KEY);

  if (mode === 'device' && token) {
    local?.setItem(KEY, token);
    local?.setItem(TOUCHED_KEY, String(Date.now()));
    return;
  }

  // Режим «помнить» выключили — с устройства убираем сразу.
  local?.removeItem(KEY);
  local?.removeItem(TOUCHED_KEY);
}

export function clearAll(): void {
  local?.removeItem(KEY);
  local?.removeItem(MODE_KEY);
  local?.removeItem(TOUCHED_KEY);
  session?.removeItem(KEY);
}
