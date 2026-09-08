import { Injectable } from '@nestjs/common';
import { RiskLevel } from '@prisma/client';

/**
 * Первичный скрининг текста. Это НЕ диагностика и не замена специалисту:
 * задача — поднять диалог в очереди и показать ребёнку телефон доверия
 * до того, как освободится психолог.
 *
 * Список маркеров намеренно широкий: ложное срабатывание здесь дешевле пропуска.
 */

const CRITICAL_MARKERS = [
  'не хочу жить',
  'не хочется жить',
  'хочу умереть',
  'жить надоело',
  'покончить с собой',
  'суицид',
  'убить себя',
  'мне незачем жить',
  'лучше бы меня не было',
  'все закончить',
  'всё закончить',
  'режу себя',
  'причиняю себе',
  'селфхарм',
  'меня насилуют',
  'меня бьют дома',
  'меня избили',
  'угрожают убить',
];

const ELEVATED_MARKERS = [
  'травят',
  'буллинг',
  'издеваются',
  'бьют',
  'угрожают',
  'шантажируют',
  'выложили мое',
  'выложили моё',
  'слили фото',
  'боюсь идти в школу',
  'никто не поможет',
  'мне страшно',
  'ненавижу себя',
  'я никому не нужен',
  'я никому не нужна',
  'панические атаки',
  'не могу дышать',
];

@Injectable()
export class SafetyService {
  assess(text: string): RiskLevel {
    const normalized = text
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9\s]/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const has = (list: string[]) =>
      list.some((marker) => normalized.includes(marker.replace(/ё/g, 'е')));

    if (has(CRITICAL_MARKERS)) return RiskLevel.CRITICAL;
    if (has(ELEVATED_MARKERS)) return RiskLevel.ELEVATED;
    return RiskLevel.NONE;
  }

  /** Приоритет: CRITICAL > ELEVATED > NONE. Уровень диалога только повышается. */
  escalate(current: RiskLevel, next: RiskLevel): RiskLevel {
    const weight: Record<RiskLevel, number> = {
      [RiskLevel.NONE]: 0,
      [RiskLevel.ELEVATED]: 1,
      [RiskLevel.CRITICAL]: 2,
    };
    return weight[next] > weight[current] ? next : current;
  }

  /** Сообщение, которое ребёнок видит сразу при критическом маркере. */
  crisisMessage(): string {
    return [
      'То, что ты написал, звучит очень тяжело. Я рядом и читаю.',
      '',
      'Если прямо сейчас есть угроза жизни или здоровью — набери 112.',
      'Позвонить и поговорить можно круглосуточно и бесплатно: 8-800-2000-122, детский телефон доверия. Там не спросят имя.',
      '',
      'Расскажи, что происходит. Мы разберёмся вместе, и хорошо бы подключить взрослого, которому ты доверяешь.',
    ].join('\n');
  }
}
