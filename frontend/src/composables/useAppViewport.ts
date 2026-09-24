import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * Высота экрана на мобильных.
 *
 * 100dvh недостаточно: на iOS при открытии клавиатуры layout viewport не
 * меняется, страница просто уезжает вверх — шапка и лента исчезают, остаётся
 * поле ввода где-то за краем. Единственный надёжный источник правды —
 * visualViewport: он знает реальную видимую область и её смещение.
 *
 * Отдаём в CSS две переменные:
 *   --app-height — высота видимой области
 *   --app-top    — на сколько видимая область смещена сверху
 *
 * Плюс --kb-open и реактивный keyboardOpen: когда клавиатуры нет места,
 * второстепенное с экрана убирается.
 */

const KEYBOARD_THRESHOLD = 120; // px «съеденной» высоты, ниже которой это не клавиатура

export function useAppViewport(onResize?: () => void) {
  const root = document.documentElement;
  const keyboardOpen = ref(false);
  let baseHeight = 0;

  function apply() {
    const vv = window.visualViewport;
    const height = vv?.height ?? window.innerHeight;
    const top = vv?.offsetTop ?? 0;

    baseHeight = Math.max(baseHeight, height);
    keyboardOpen.value = baseHeight - height > KEYBOARD_THRESHOLD;

    root.style.setProperty('--app-height', `${Math.round(height)}px`);
    root.style.setProperty('--app-top', `${Math.round(top)}px`);
    root.style.setProperty('--kb-open', keyboardOpen.value ? '1' : '0');

    onResize?.();
  }

  /** Поворот экрана меняет «полную» высоту — базу надо пересчитать. */
  function reset() {
    baseHeight = 0;
    apply();
  }

  onMounted(() => {
    apply();
    const vv = window.visualViewport;
    vv?.addEventListener('resize', apply);
    vv?.addEventListener('scroll', apply);
    window.addEventListener('resize', apply);
    window.addEventListener('orientationchange', reset);
  });

  onBeforeUnmount(() => {
    const vv = window.visualViewport;
    vv?.removeEventListener('resize', apply);
    vv?.removeEventListener('scroll', apply);
    window.removeEventListener('resize', apply);
    window.removeEventListener('orientationchange', reset);
    root.style.removeProperty('--app-height');
    root.style.removeProperty('--app-top');
    root.style.removeProperty('--kb-open');
  });

  return { apply, keyboardOpen };
}
