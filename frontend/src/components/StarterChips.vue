<script setup lang="ts">
const emit = defineEmits<{ (e: 'pick', text: string): void }>();

// Формулировки от первого лица: ребёнку проще нажать готовую фразу,
// чем найти слова для того, что с ним происходит.
const starters = [
  'Меня травят в школе',
  'Мне пишут гадости в интернете',
  'Мне тревожно и страшно',
  'Я не знаю, с чего начать',
];
</script>

<template>
  <div class="chips scroll-area">
    <button
      v-for="text in starters"
      :key="text"
      type="button"
      class="chip"
      @click="emit('pick', text)"
    >
      {{ text }}
    </button>
  </div>
</template>

<style scoped>
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: var(--space-2) 0 var(--space-4);
}

.chip {
  padding: 9px 15px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid var(--mist-deep);
  color: var(--ink-soft);
  font-size: var(--text-sm);
  transition:
    background 180ms var(--ease-calm),
    color 180ms var(--ease-calm),
    border-color 180ms var(--ease-calm);
}

.chip:hover {
  background: var(--moss-wash);
  border-color: transparent;
  color: var(--moss-deep);
}

/* На телефоне подсказки едут одной строкой с прокруткой: перенос в три ряда
   съедал бы половину экрана ещё до того, как ребёнок начал печатать. */
@media (max-width: 34rem) {
  .chips {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin: var(--space-2) 0 var(--space-3);
    padding-bottom: 2px;
    scrollbar-width: none;
    scroll-snap-type: x proximity;
  }

  .chips::-webkit-scrollbar {
    display: none;
  }

  .chip {
    flex: none;
    scroll-snap-align: start;
    background: var(--paper);
  }
}
</style>
