const BASE = import.meta.env.VITE_API_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Запрос ${path} завершился с кодом ${response.status}`);
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
