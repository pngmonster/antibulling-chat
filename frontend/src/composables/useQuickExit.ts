import { onMounted, onBeforeUnmount } from 'vue';
import { clearAll } from '../api/storage';

/**
 * Быстрый выход. Ребёнок может читать это с общего компьютера или телефона,
 * который в любой момент возьмут в руки. Уводим со страницы мгновенно:
 * тройное нажатие Esc или кнопка в шапке.
 *
 * location.replace не оставляет текущую страницу в истории «назад».
 * Полностью очистить историю браузера из JS нельзя — об этом честно
 * написано в разделе «Приватность».
 */
const SAFE_URL = 'https://ya.ru';

export function useQuickExit() {
  let taps = 0;
  let timer: number | undefined;

  function leave() {
    clearAll();
    document.documentElement.innerHTML = '';
    window.location.replace(SAFE_URL);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    taps += 1;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => (taps = 0), 900);
    if (taps >= 3) leave();
  }

  onMounted(() => window.addEventListener('keydown', onKeydown));
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown);
    window.clearTimeout(timer);
  });

  return { leave };
}
