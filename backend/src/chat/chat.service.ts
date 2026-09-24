import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';
import { Author, ConversationStatus, RiskLevel } from '@prisma/client';

export interface PublicMessage {
  id: string;
  author: Author;
  body: string;
  createdAt: string;
}

export const MAX_MESSAGE_LENGTH = 2000;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly safety: SafetyService,
  ) {}

  async history(conversationId: string): Promise<PublicMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });
    return messages.map(this.toPublic);
  }

  async addChildMessage(conversationId: string, rawBody: string) {
    const body = this.sanitize(rawBody);
    const risk = this.safety.assess(body);

    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
    });
    const nextRisk = this.safety.escalate(conversation.risk, risk);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        author: Author.CHILD,
        body,
        flagged: risk !== RiskLevel.NONE,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        risk: nextRisk,
        // Ребёнок вернулся в закрытый диалог — возвращаем его в очередь,
        // иначе сообщение уйдёт в пустоту: закрытые диалоги психолог не видит.
        ...(conversation.status === ConversationStatus.CLOSED
          ? { status: ConversationStatus.WAITING, closedAt: null }
          : {}),
      },
    });

    // Кризисная подсказка показывается один раз за диалог.
    let systemMessage: PublicMessage | null = null;
    if (risk === RiskLevel.CRITICAL && conversation.risk !== RiskLevel.CRITICAL) {
      const created = await this.prisma.message.create({
        data: {
          conversationId,
          author: Author.SYSTEM,
          body: this.safety.crisisMessage(),
        },
      });
      systemMessage = this.toPublic(created);
    }

    return { message: this.toPublic(message), systemMessage, risk: nextRisk };
  }

  async addOperatorMessage(conversationId: string, operatorId: string, rawBody: string) {
    const body = this.sanitize(rawBody);

    const message = await this.prisma.message.create({
      data: { conversationId, author: Author.PSYCHOLOGIST, body },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        status: ConversationStatus.ACTIVE,
        operatorId,
      },
    });

    return this.toPublic(message);
  }

  /** Очередь для панели психолога: сначала кризис, затем самые давние. */
  async queue() {
    const conversations = await this.prisma.conversation.findMany({
      where: { status: { in: [ConversationStatus.WAITING, ConversationStatus.ACTIVE] } },
      orderBy: [{ risk: 'desc' }, { lastMessageAt: 'asc' }],
      take: 100,
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });

    return conversations.map((c) => ({
      id: c.id,
      alias: c.alias,
      status: c.status,
      risk: c.risk,
      messageCount: c._count.messages,
      lastMessageAt: c.lastMessageAt.toISOString(),
      preview: c.messages[0]?.body.slice(0, 120) ?? '',
    }));
  }

  private sanitize(body: string): string {
    return body.replace(/\u0000/g, '').trim().slice(0, MAX_MESSAGE_LENGTH);
  }

  private toPublic = (m: {
    id: string;
    author: Author;
    body: string;
    createdAt: Date;
  }): PublicMessage => ({
    id: m.id,
    author: m.author,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  });
}
