import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Socket } from 'socket.io-client';
import { api } from '../api/http';
import { connectAsChild } from '../api/socket';
import { readToken, writeToken, clearAll } from '../api/storage';

export type Author = 'CHILD' | 'PSYCHOLOGIST' | 'SYSTEM' | 'DIVIDER';

export interface ChatMessage {
  id: string;
  author: Author;
  body: string;
  createdAt: string;
  pending?: boolean;
}

export type Connection = 'idle' | 'connecting' | 'online' | 'offline';

/** Пауза, после которой в ленте появляется отметка о возвращении. */
const RETURN_GAP_MS = 30 * 60 * 1000;

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([]);
  const connection = ref<Connection>('idle');
  const psychologistTyping = ref(false);
  const revealing = ref(false); // «печатает…» перед первым приветствием
  const errorText = ref('');

  let socket: Socket | null = null;
  let typingTimer: number | undefined;

  const hasChildMessage = computed(() => messages.value.some((m) => m.author === 'CHILD'));

  async function start() {
    if (socket) return;
    connection.value = 'connecting';

    try {
      let token = readToken();
      let freshSession = false;

      if (!token) {
        const created = await api.createSession();
        token = created.token;
        writeToken(token);
        freshSession = true;
      }

      revealing.value = freshSession;
      attach(token, freshSession);
    } catch {
      connection.value = 'offline';
      errorText.value = 'Не получается соединиться. Проверь интернет — я подключусь сам, как только связь вернётся.';
    }
  }

  function attach(token: string, freshSession: boolean) {
    socket = connectAsChild(token);

    socket.on('connect', () => {
      connection.value = 'online';
      errorText.value = '';
    });

    socket.on('disconnect', () => {
      connection.value = 'offline';
    });

    socket.on('connect_error', () => {
      connection.value = 'offline';
    });

    socket.on('session:invalid', async () => {
      // Диалог удалён или устарел — начинаем чистый разговор.
      clearAll();
      socket?.disconnect();
      socket = null;
      messages.value = [];
      await start();
    });

    socket.on('history', (history: ChatMessage[]) => {
      const apply = () => {
        messages.value = withReturnMark(history);
        revealing.value = false;
      };
      // Единственная неинтерактивная анимация во всём интерфейсе:
      // первое приветствие «печатается», чтобы разговор ощущался живым.
      if (freshSession && prefersMotion()) {
        window.setTimeout(apply, 1100);
      } else {
        apply();
      }
    });

    socket.on('message:new', (message: ChatMessage) => {
      const withoutPending = messages.value.filter(
        (m) => !(m.pending && m.body === message.body && m.author === message.author),
      );
      if (withoutPending.some((m) => m.id === message.id)) return;
      messages.value = withoutPending.concat(message);
      if (message.author !== 'CHILD') psychologistTyping.value = false;
    });

    socket.on('typing', ({ isTyping }: { isTyping: boolean }) => {
      psychologistTyping.value = isTyping;
    });

    socket.on('error:message', ({ reason }: { reason: string }) => {
      errorText.value =
        reason === 'too_fast'
          ? 'Слишком много сообщений подряд. Подожди пару секунд, я никуда не денусь.'
          : 'Сообщение слишком длинное. Раздели его на части — так даже проще читать.';
    });
  }

  function send(text: string) {
    const body = text.trim();
    if (!body || !socket) return;

    messages.value.push({
      id: `pending-${Date.now()}`,
      author: 'CHILD',
      body,
      createdAt: new Date().toISOString(),
      pending: true,
    });

    socket.emit('message:send', { text: body });
    notifyTyping(false);
  }

  function notifyTyping(isTyping: boolean) {
    if (!socket) return;
    socket.emit('typing', { isTyping });
    window.clearTimeout(typingTimer);
    if (isTyping) {
      typingTimer = window.setTimeout(() => socket?.emit('typing', { isTyping: false }), 2500);
    }
  }

  /** Полностью стирает разговор: на сервере и в браузере. */
  async function purge() {
    const token = readToken();
    socket?.disconnect();
    socket = null;
    if (token) {
      try {
        await api.purgeSession(token);
      } catch {
        /* даже если сервер недоступен — локальные следы убираем */
      }
    }
    clearAll();
    messages.value = [];
    connection.value = 'idle';
  }

  /**
   * Ребёнок вернулся после перерыва — показываем тихую отметку,
   * чтобы старая переписка не выглядела как то, что происходит прямо сейчас.
   */
  function withReturnMark(history: ChatMessage[]): ChatMessage[] {
    const last = history[history.length - 1];
    if (!last) return history;

    const pause = Date.now() - new Date(last.createdAt).getTime();
    if (pause < RETURN_GAP_MS) return history;

    return history.concat({
      id: `divider-${last.id}`,
      author: 'DIVIDER',
      body: formatGap(pause),
      createdAt: new Date().toISOString(),
    });
  }

  function formatGap(pause: number): string {
    const days = Math.floor(pause / 86_400_000);
    if (days >= 1) return days === 1 ? 'Вчера и раньше' : `${days} дня назад и раньше`;
    return 'Ранее сегодня';
  }

  function prefersMotion() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  return {
    messages,
    connection,
    psychologistTyping,
    revealing,
    errorText,
    hasChildMessage,
    start,
    send,
    notifyTyping,
    purge,
  };
});
