<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount } from 'vue';
import type { Socket } from 'socket.io-client';
import { api } from '../api/http';
import { connectAsOperator } from '../api/socket';
import type { ChatMessage } from '../stores/chat';

interface QueueItem {
  id: string;
  alias: string;
  status: 'WAITING' | 'ACTIVE' | 'CLOSED';
  risk: 'NONE' | 'ELEVATED' | 'CRITICAL';
  messageCount: number;
  lastMessageAt: string;
  preview: string;
}

const login = ref('');
const password = ref('');
const authError = ref('');
const displayName = ref('');
const authorized = ref(false);

const queue = ref<QueueItem[]>([]);
const activeId = ref<string | null>(null);
const messages = ref<ChatMessage[]>([]);
const draft = ref('');
const thread = ref<HTMLElement | null>(null);

let socket: Socket | null = null;

const riskLabel: Record<QueueItem['risk'], string> = {
  NONE: '',
  ELEVATED: 'внимание',
  CRITICAL: 'кризис',
};

async function signIn() {
  authError.value = '';
  try {
    const result = await api.operatorLogin(login.value.trim(), password.value);
    displayName.value = result.displayName;
    authorized.value = true;
    password.value = '';
    connect(result.token);
  } catch {
    authError.value = 'Логин или пароль не подошли. Проверь раскладку и попробуй ещё раз.';
  }
}

function connect(jwt: string) {
  socket = connectAsOperator(jwt);
  socket.on('operator:queue', (items: QueueItem[]) => (queue.value = items));
  socket.on('history', (history: ChatMessage[]) => {
    messages.value = history;
    scrollToEnd();
  });
  socket.on('message:new', (message: ChatMessage) => {
    if (!activeId.value) return;
    messages.value = messages.value.concat(message);
    scrollToEnd();
  });
}

function open(item: QueueItem) {
  activeId.value = item.id;
  messages.value = [];
  socket?.emit('operator:open', { conversationId: item.id });
}

function send() {
  const text = draft.value.trim();
  if (!text || !activeId.value) return;
  socket?.emit('message:send', { text, conversationId: activeId.value });
  draft.value = '';
}

function scrollToEnd() {
  nextTick(() => {
    if (thread.value) thread.value.scrollTop = thread.value.scrollHeight;
  });
}

function shortTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

onBeforeUnmount(() => socket?.disconnect());
</script>

<template>
  <div v-if="!authorized" class="gate">
    <form class="gate__card" @submit.prevent="signIn">
      <h1 class="gate__title">Вход для психолога</h1>
      <label class="field">
        <span>Логин</span>
        <input v-model="login" type="text" autocomplete="username" required />
      </label>
      <label class="field">
        <span>Пароль</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="authError" class="gate__error">{{ authError }}</p>
      <button class="gate__submit" type="submit">Войти</button>
    </form>
  </div>

  <div v-else class="console">
    <aside class="queue scroll-area">
      <header class="queue__head">
        <span>Очередь</span>
        <span class="queue__who">{{ displayName }}</span>
      </header>

      <p v-if="!queue.length" class="queue__empty">Пока никто не написал.</p>

      <button
        v-for="item in queue"
        :key="item.id"
        class="card"
        :class="{ 'card--active': item.id === activeId, 'card--risk': item.risk !== 'NONE' }"
        type="button"
        @click="open(item)"
      >
        <span class="card__top">
          <span class="card__alias">{{ item.alias }}</span>
          <span class="card__time">{{ shortTime(item.lastMessageAt) }}</span>
        </span>
        <span class="card__preview">{{ item.preview }}</span>
        <span v-if="item.risk !== 'NONE'" class="card__risk" :data-risk="item.risk">
          {{ riskLabel[item.risk] }}
        </span>
      </button>
    </aside>

    <section class="dialog">
      <div v-if="!activeId" class="dialog__empty">Выбери диалог слева, чтобы начать разговор.</div>

      <template v-else>
        <div ref="thread" class="dialog__thread scroll-area">
          <div v-for="m in messages" :key="m.id" class="line" :data-author="m.author">
            <span class="line__body">{{ m.body }}</span>
            <span class="line__time">{{ shortTime(m.createdAt) }}</span>
          </div>
        </div>

        <div class="dialog__composer">
          <textarea
            v-model="draft"
            rows="2"
            placeholder="Ответ ребёнку"
            @keydown.enter.exact.prevent="send"
          ></textarea>
          <button type="button" :disabled="!draft.trim()" @click="send">Отправить</button>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
/* Панель психолога — рабочий инструмент: плотнее и суше детского экрана. */
.gate {
  display: grid;
  place-items: center;
  height: 100dvh;
  padding: var(--space-4);
}

.gate__card {
  display: grid;
  gap: var(--space-4);
  width: min(100%, 22rem);
  padding: var(--space-6);
  background: var(--paper);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-rest);
}

.gate__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 600;
}

.field {
  display: grid;
  gap: 6px;
  font-size: var(--text-sm);
  color: var(--ink-soft);
}

.field input {
  padding: 11px 14px;
  border: 1px solid var(--mist-deep);
  border-radius: 14px;
  background: var(--mist);
}

.gate__error {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--clay);
}

.gate__submit {
  padding: 12px;
  border-radius: 14px;
  background: var(--moss);
  color: #fff;
  font-weight: 500;
}

.console {
  display: grid;
  grid-template-columns: 21rem 1fr;
  height: 100dvh;
}

.queue {
  overflow-y: auto;
  padding: var(--space-4);
  border-right: 1px solid var(--mist-deep);
}

.queue__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
  color: var(--ink-soft);
}

.queue__who {
  color: var(--ink-faint);
}

.queue__empty {
  color: var(--ink-faint);
  font-size: var(--text-sm);
}

.card {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: var(--space-3);
  margin-bottom: var(--space-2);
  text-align: left;
  background: var(--paper);
  border-radius: 16px;
  box-shadow: var(--shadow-rest);
}

.card--active {
  outline: 2px solid var(--moss);
}

.card--risk {
  background: var(--sand);
}

.card__top {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-sm);
}

.card__time {
  color: var(--ink-faint);
}

.card__preview {
  font-size: var(--text-xs);
  color: var(--ink-soft);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card__risk {
  justify-self: start;
  padding: 2px 9px;
  border-radius: var(--radius-pill);
  background: rgba(138, 106, 79, 0.12);
  color: var(--clay);
  font-size: var(--text-xs);
}

.dialog {
  display: grid;
  grid-template-rows: 1fr auto;
  min-height: 0;
}

.dialog__empty {
  display: grid;
  place-items: center;
  color: var(--ink-faint);
}

.dialog__thread {
  overflow-y: auto;
  padding: var(--space-5);
  display: grid;
  gap: var(--space-3);
  align-content: start;
}

.line {
  max-width: 34rem;
  padding: 10px 14px;
  border-radius: 16px;
  background: var(--paper);
  box-shadow: var(--shadow-rest);
  white-space: pre-wrap;
}

.line[data-author='PSYCHOLOGIST'] {
  justify-self: end;
  background: var(--moss-wash);
}

.line[data-author='SYSTEM'] {
  justify-self: center;
  background: var(--sand);
  font-size: var(--text-sm);
}

.line__time {
  display: block;
  margin-top: 3px;
  font-size: var(--text-xs);
  color: var(--ink-faint);
}

.dialog__composer {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--mist-deep);
}

.dialog__composer textarea {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--mist-deep);
  border-radius: 14px;
  background: var(--mist);
  resize: none;
}

.dialog__composer button {
  padding: 0 22px;
  border-radius: 14px;
  background: var(--moss);
  color: #fff;
}

.dialog__composer button:disabled {
  background: var(--mist-deep);
  color: var(--ink-faint);
}

@media (max-width: 52rem) {
  .console {
    grid-template-columns: 1fr;
    grid-template-rows: 14rem 1fr;
  }

  .queue {
    border-right: none;
    border-bottom: 1px solid var(--mist-deep);
  }
}
</style>
