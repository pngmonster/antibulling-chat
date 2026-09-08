<template>
  <div class="ambient" aria-hidden="true">
    <span class="glow glow--window"></span>
    <span class="glow glow--warm"></span>
  </div>
</template>

<style scoped>
/*
  Свет из невидимого окна. Движение очень медленное (90 с) и малой амплитуды —
  оно не должно попадать в фокус внимания, только не давать фону быть мёртвым.
*/
.ambient {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.glow {
  position: absolute;
  display: block;
  border-radius: 50%;
  filter: blur(90px);
}

.glow--window {
  width: 46rem;
  height: 46rem;
  top: -18rem;
  right: -12rem;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%);
  animation: drift-window 90s var(--ease-calm) infinite alternate;
}

.glow--warm {
  width: 34rem;
  height: 34rem;
  bottom: -14rem;
  left: -10rem;
  background: radial-gradient(circle, rgba(246, 237, 227, 0.85) 0%, rgba(246, 237, 227, 0) 72%);
  animation: drift-warm 110s var(--ease-calm) infinite alternate;
}

@keyframes drift-window {
  to {
    transform: translate3d(-4rem, 3rem, 0) scale(1.08);
  }
}

@keyframes drift-warm {
  to {
    transform: translate3d(3rem, -2rem, 0) scale(1.05);
  }
}
</style>
