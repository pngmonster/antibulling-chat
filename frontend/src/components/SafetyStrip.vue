<script setup lang="ts">
import { ref } from 'vue';
import { getMode, setMode, type StorageMode } from '../api/storage';

const emit = defineEmits<{ (e: 'purge'): void }>();

const open = ref(false);
const mode = ref<StorageMode>(getMode());

function toggleMode() {
  mode.value = mode.value === 'device' ? 'session' : 'device';
  setMode(mode.value);
}
</script>

<template>
  <div class="strip">
    <p class="line">
      Если сейчас есть опасность — звони
      <a href="tel:112">112</a>. Поговорить круглосуточно и бесплатно:
      <a href="tel:88002000122">8 800 2000 122</a>.
    </p>

    <button class="more" type="button" :aria-expanded="open" @click="open = !open">
      {{ open ? 'Свернуть' : 'Приватность' }}
    </button>

    <div v-if="open" class="panel">
      <div class="option">
        <div>
          <p class="option__title">Помнить разговор на этом устройстве</p>
          <p class="option__hint">
            Выключено — переписка исчезнет из браузера, как только ты закроешь вкладку.
          </p>
        </div>
        <button
          class="switch"
          type="button"
          role="switch"
          :aria-checked="mode === 'device'"
          @click="toggleMode"
        >
          <span class="switch__knob"></span>
        </button>
      </div>

      <div class="option">
        <div>
          <p class="option__title">Удалить переписку</p>
          <p class="option__hint">Сообщения сотрутся и у нас, и у тебя. Отменить не получится.</p>
        </div>
        <button class="danger" type="button" @click="emit('purge')">Удалить</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--ink-soft);
}

.line {
  margin: 0;
  flex: 1;
  min-width: 15rem;
}

.line a {
  color: var(--ink);
  text-decoration-color: var(--ink-faint);
  text-underline-offset: 3px;
  white-space: nowrap;
}

.more {
  color: var(--ink-soft);
  text-decoration: underline;
  text-decoration-color: var(--mist-deep);
  text-underline-offset: 3px;
  font-size: var(--text-sm);
}

.more:hover {
  color: var(--ink);
}

.panel {
  flex-basis: 100%;
  display: grid;
  gap: var(--space-4);
  margin-top: var(--space-2);
  padding: var(--space-4) var(--space-5);
  background: var(--paper);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-rest);
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.option__title {
  margin: 0;
  color: var(--ink);
}

.option__hint {
  margin: 2px 0 0;
  font-size: var(--text-xs);
  color: var(--ink-faint);
  max-width: 26rem;
}

.switch {
  flex: none;
  width: 46px;
  height: 27px;
  padding: 3px;
  border-radius: var(--radius-pill);
  background: var(--mist-deep);
  transition: background 220ms var(--ease-calm);
}

.switch[aria-checked='true'] {
  background: var(--moss);
}

.switch__knob {
  display: block;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  background: #fff;
  transition: transform 220ms var(--ease-calm);
}

.switch[aria-checked='true'] .switch__knob {
  transform: translateX(19px);
}

.danger {
  flex: none;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--sand-line);
  background: var(--sand);
  color: var(--clay);
  font-size: var(--text-sm);
}

.danger:hover {
  background: #f1e3d3;
}
</style>
