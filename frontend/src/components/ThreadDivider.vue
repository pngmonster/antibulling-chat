<script setup lang="ts">
defineProps<{ label: string }>();
</script>

<template>
  <div class="divider">
    <span class="divider__line" aria-hidden="true"></span>
    <span class="divider__label">{{ label }}</span>
    <span class="divider__line" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-5) 0 var(--space-4);
}

.divider__line {
  flex: 1;
  height: 1px;
  background: var(--mist-deep);
}

.divider__label {
  flex: none;
  font-size: var(--text-xs);
  color: var(--ink-faint);
  white-space: nowrap;
}
</style>
