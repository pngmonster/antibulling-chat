<script setup lang="ts">
import type { Connection } from '../stores/chat';

defineProps<{ connection: Connection }>();
const emit = defineEmits<{ (e: 'exit'): void }>();

const labels: Record<Connection, string> = {
  idle: 'Подключаюсь',
  connecting: 'Подключаюсь',
  online: 'Психолог на связи',
  offline: 'Связь пропала, восстанавливаю',
};
</script>

<template>
  <header class="header">
    <div class="identity">
      <span class="mark">Рядом</span>
      <span class="status" :data-state="connection">
        <span class="pulse"></span>
        {{ labels[connection] }}
      </span>
    </div>

    <button class="exit" type="button" @click="emit('exit')">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
        <path
          d="M3.5 3.5l8 8M11.5 3.5l-8 8"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
        />
      </svg>
      Быстро закрыть
    </button>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  width: min(100%, var(--thread-width));
  margin: 0 auto;
  padding: var(--space-4) var(--space-5) var(--space-3);
}

.identity {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  min-width: 0;
}

.mark {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: -0.015em;
  color: var(--ink);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--text-sm);
  color: var(--ink-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pulse {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ink-faint);
  flex: none;
  transition: background 400ms var(--ease-calm);
}

.status[data-state='online'] .pulse {
  background: var(--moss);
  box-shadow: 0 0 0 4px rgba(79, 125, 110, 0.14);
}

.status[data-state='offline'] .pulse {
  background: var(--clay);
}

.exit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 7px 14px 7px 11px;
  border-radius: var(--radius-pill);
  background: var(--paper);
  color: var(--ink-soft);
  font-size: var(--text-sm);
  box-shadow: var(--shadow-rest);
  transition:
    color 200ms var(--ease-calm),
    box-shadow 200ms var(--ease-calm);
}

.exit:hover {
  color: var(--ink);
  box-shadow: var(--shadow-lift);
}

@media (max-width: 30rem) {
  .header {
    padding: var(--space-3) var(--space-4);
  }

  .identity {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .exit span,
  .exit {
    font-size: var(--text-xs);
  }
}
</style>
