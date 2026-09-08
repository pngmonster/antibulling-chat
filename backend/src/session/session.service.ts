import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { Author, ConversationStatus, Conversation } from '@prisma/client';

export const GREETING = [
  'Привет. Меня зовут Аня, я психолог.',
  'Здесь анонимно: я не вижу твоего имени, школы и города, а регистрация не нужна.',
  'Расскажи своими словами, что случилось. Можно коротко — я задам вопросы.',
].join('\n');

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  static hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Создаёт новый анонимный диалог и возвращает токен (он живёт только в браузере). */
  async create(): Promise<{ token: string; conversation: Conversation }> {
    const token = randomBytes(32).toString('hex');
    const alias = `Гость-${randomBytes(2).readUInt16BE(0) % 9000 + 1000}`;

    const conversation = await this.prisma.conversation.create({
      data: {
        sessionHash: SessionService.hash(token),
        alias,
        messages: {
          create: { author: Author.PSYCHOLOGIST, body: GREETING },
        },
      },
    });

    return { token, conversation };
  }

  async findByToken(token: string): Promise<Conversation | null> {
    if (!token || token.length < 32) return null;
    return this.prisma.conversation.findUnique({
      where: { sessionHash: SessionService.hash(token) },
    });
  }

  /** Ребёнок нажал «Удалить переписку» — стираем всё безвозвратно. */
  async purge(token: string): Promise<boolean> {
    const conversation = await this.findByToken(token);
    if (!conversation) return false;
    await this.prisma.conversation.delete({ where: { id: conversation.id } });
    return true;
  }

  async close(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: ConversationStatus.CLOSED, closedAt: new Date() },
    });
  }
}
