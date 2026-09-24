import { onMounted, onBeforeUnmount } from 'vue';
import { clearAll } from '../api/storage';

/**
 * Быстрый выход. Ребёнок может читать это с общего устройства, которое в любой
 * момент возьмут в руки. Уводим со страницы мгновенно: кнопка в шапке или
 * тройное нажатие Esc.
 *
 * Разговор при этом сохраняется — выход нужен, чтобы спрятать экран от того,
 * кто вошёл в комнату, а не чтобы потерять переписку. Полное стирание вынесено
 * в отдельное действие «Удалить переписку» в блоке «Приватность».
 *
 * location.replace не оставляет текущую страницу в истории «назад».
 * Полностью очистить историю браузера из JS нельзя — об этом честно сказано
 * в интерфейсе.
 */
const SAFE_URL = 'https://ya.ru';

export function useQuickExit() {
  let taps = 0;
  let timer: number | undefined;

  function leave() {
    document.documentElement.innerHTML = '';
    window.location.replace(SAFE_URL);
  }

  /** Стереть всё и уйти: одно осознанное действие вместо двух шагов. */
  function wipeAndLeave() {
    clearAll();
    leave();
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

  return { leave, wipeAndLeave };
}
