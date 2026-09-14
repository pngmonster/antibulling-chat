const BASE = import.meta.env.VITE_API_URL ?? '/api';

/** Ошибка запроса с кодом ответа — интерфейсу нужно различать 400, 401 и обрыв связи. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError('Сервер не отвечает', 0);
  }

  if (!response.ok) {
    throw new ApiError(`Запрос ${path} завершился с кодом ${response.status}`, response.status);
  }

  return (await response.json()) as T;
}

export interface CreatedSession {
  token: string;
  conversationId: string;
  alias: string;
}

export const api = {
  createSession: () => request<CreatedSession>('/session', { method: 'POST' }),

  purgeSession: (token: string) =>
    request<{ deleted: boolean }>('/session', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    }),

  operatorLogin: (login: string, password: string) =>
    request<{ token: string; displayName: string }>('/operator/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),
};
