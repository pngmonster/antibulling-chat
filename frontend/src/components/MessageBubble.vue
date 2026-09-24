<script setup lang="ts">
import { computed } from 'vue';
import type { ChatMessage } from '../stores/chat';

const props = defineProps<{ message: ChatMessage }>();

const time = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }),
);

const lines = computed(() => props.message.body.split('\n'));
</script>

<template>
  <div class="row" :data-author="message.author">
    <!-- Системный блок с телефонами намеренно выглядит как записка, а не как сообщение -->
    <div v-if="message.author === 'SYSTEM'" class="note">
      <p v-for="(line, i) in lines" :key="i" class="note__line">{{ line || '\u00A0' }}</p>
      <div class="note__contacts">
        <a class="contact" href="tel:112">112 — экстренные службы</a>
        <a class="contact" href="tel:88002000122">8 800 2000 122 — телефон доверия</a>
      </div>
    </div>

    <div v-else class="bubble" :class="{ 'bubble--pending': message.pending }">
      <p v-for="(line, i) in lines" :key="i" class="bubble__line">{{ line || '\u00A0' }}</p>
      <span class="bubble__time">{{ message.pending ? 'отправляю' : time }}</span>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  margin-bottom: var(--space-3);
}

.row[data-author='CHILD'] {
  justify-content: flex-end;
}

.row[data-author='SYSTEM'] {
  justify-content: center;
}

.bubble {
  position: relative;
  max-width: 32rem;
  padding: 12px 16px 8px;
  border-radius: var(--radius-bubble);
  font-size: var(--text-md);
  overflow-wrap: anywhere;
}

.row[data-author='PSYCHOLOGIST'] .bubble {
  background: var(--paper);
  border-bottom-left-radius: var(--radius-tail);
  box-shadow: var(--shadow-rest);
}

.row[data-author='CHILD'] .bubble {
  background: var(--moss);
  color: #fff;
  border-bottom-right-radius: var(--radius-tail);
}

.bubble--pending {
  opacity: 0.62;
}

.bubble__line {
  margin: 0;
}

.bubble__line + .bubble__line {
  margin-top: 0.45em;
}

.bubble__time {
  display: block;
  margin-top: 3px;
  font-size: var(--text-xs);
  text-align: right;
  color: var(--ink-faint);
}

.row[data-author='CHILD'] .bubble__time {
  color: rgba(255, 255, 255, 0.62);
}

@media (max-width: 34rem) {
  .bubble {
    max-width: 88%;
    font-size: var(--text-base);
    padding: 10px 14px 6px;
  }

  .row {
    margin-bottom: var(--space-2);
  }
}

.note {
  max-width: 34rem;
  width: 100%;
  padding: var(--space-4) var(--space-5);
  background: var(--sand);
  border: 1px solid var(--sand-line);
  border-radius: var(--radius-panel);
  color: var(--clay);
  font-size: var(--text-base);
}

.note__line {
  margin: 0;
  color: #5c4634;
}

@media (max-width: 34rem) {
  .note {
    padding: var(--space-3) var(--space-4);
    border-radius: 20px;
    font-size: var(--text-sm);
  }
}

.note__contacts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-4);
}

.contact {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.72);
  border-radius: var(--radius-pill);
  color: #5c4634;
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
}

.contact:hover {
  background: #fff;
}
</style>
