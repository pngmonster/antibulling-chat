import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Переписка детей не должна храниться вечно. Раз в сутки удаляем диалоги,
 * в которых давно не было сообщений; сообщения уходят вместе с диалогом
 * каскадом.
 *
 * Срок задаётся переменной CONVERSATION_TTL_DAYS. Значение 0 отключает
 * удаление — так делать не стоит, но иногда нужно на время отладки.
 */
@Injectable()
export class RetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RetentionService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const days = Number(process.env.CONVERSATION_TTL_DAYS ?? 90);

    if (!Number.isFinite(days) || days <= 0) {
      this.logger.warn('CONVERSATION_TTL_DAYS не задан — старые диалоги не удаляются');
      return;
    }

    void this.sweep(days);
    this.timer = setInterval(() => void this.sweep(days), DAY_MS);
    this.timer.unref();
    this.logger.log(`Диалоги без активности дольше ${days} дней удаляются автоматически`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async sweep(days: number) {
    try {
      const threshold = new Date(Date.now() - days * DAY_MS);
      const { count } = await this.prisma.conversation.deleteMany({
        where: { lastMessageAt: { lt: threshold } },
      });
      if (count > 0) this.logger.log(`Удалено диалогов по сроку хранения: ${count}`);
    } catch (error) {
      this.logger.error(`Очистка не выполнена: ${(error as Error).message}`);
    }
  }
}
