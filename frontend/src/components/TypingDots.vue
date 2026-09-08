<template>
  <div class="row" role="status" aria-label="Психолог печатает">
    <div class="dots">
      <span></span><span></span><span></span>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  margin-bottom: var(--space-3);
}

.dots {
  display: flex;
  gap: 5px;
  padding: 15px 18px;
  background: var(--paper);
  border-radius: var(--radius-bubble);
  border-bottom-left-radius: var(--radius-tail);
  box-shadow: var(--shadow-rest);
}

.dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ink-faint);
  animation: breathe 1.4s var(--ease-calm) infinite;
}

.dots span:nth-child(2) {
  animation-delay: 0.18s;
}

.dots span:nth-child(3) {
  animation-delay: 0.36s;
}

@keyframes breathe {
  0%,
  60%,
  100% {
    opacity: 0.32;
    transform: translateY(0);
  }
  30% {
    opacity: 0.9;
    transform: translateY(-3px);
  }
}
</style>
