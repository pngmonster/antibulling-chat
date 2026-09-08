<script setup lang="ts">
import { ref, nextTick, watch } from 'vue';

const props = defineProps<{ disabled?: boolean }>();
const emit = defineEmits<{
  (e: 'send', text: string): void;
  (e: 'typing', isTyping: boolean): void;
}>();

const text = ref('');
const field = ref<HTMLTextAreaElement | null>(null);
const MAX = 2000;

function resize() {
  const el = field.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
}

watch(text, () => {
  nextTick(resize);
  emit('typing', text.value.trim().length > 0);
});

function submit() {
  const value = text.value.trim();
  if (!value || props.disabled) return;
  emit('send', value);
  text.value = '';
  nextTick(() => {
    resize();
    field.value?.focus();
  });
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
}

/** Позволяет вставить текст из подсказки и сразу продолжить писать. */
function insert(value: string) {
  text.value = value;
  nextTick(() => {
    field.value?.focus();
    resize();
  });
}

defineExpose({ insert, focus: () => field.value?.focus() });
</script>

<template>
  <div class="composer">
    <label class="sr-only" for="message">Сообщение психологу</label>
    <textarea
      id="message"
      ref="field"
      v-model="text"
      class="field scroll-area"
      rows="1"
      :maxlength="MAX"
      placeholder="Напиши, что случилось…"
      autocomplete="off"
      spellcheck="false"
      @keydown="onKeydown"
    ></textarea>

    <button
      class="send"
      type="button"
      :disabled="!text.trim() || disabled"
      aria-label="Отправить сообщение"
      @click="submit"
    >
      <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
        <path
          d="M9.5 15.5V3.8M9.5 3.8L4.6 8.7M9.5 3.8l4.9 4.9"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.composer {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  padding: 7px 7px 7px var(--space-5);
  background: var(--paper);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-lift);
}

.field {
  flex: 1;
  min-height: 30px;
  max-height: 200px;
  padding: 11px 0;
  border: none;
  background: transparent;
  font-size: var(--text-md);
  line-height: 1.5;
  resize: none;
}

.field:focus {
  outline: none;
}

.field::placeholder {
  color: var(--ink-faint);
}

.send {
  display: grid;
  place-items: center;
  flex: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--moss);
  color: #fff;
  transition:
    background 200ms var(--ease-calm),
    opacity 200ms var(--ease-calm),
    transform 200ms var(--ease-calm);
}

.send:hover:not(:disabled) {
  background: var(--moss-deep);
}

.send:active:not(:disabled) {
  transform: scale(0.94);
}

.send:disabled {
  background: var(--mist-deep);
  color: var(--ink-faint);
  cursor: default;
}
</style>
