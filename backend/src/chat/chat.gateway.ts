import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { RiskLevel } from '@prisma/client';
import { ChatService, MAX_MESSAGE_LENGTH } from './chat.service';
import { SessionService } from '../session/session.service';

type Role = 'child' | 'operator';

interface SocketState {
  role: Role;
  conversationId?: string;
  operatorId?: string;
}

const OPERATORS_ROOM = 'operators';
const room = (conversationId: string) => `conv:${conversationId}`;

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly state = new Map<string, SocketState>();
  private readonly lastMessageAt = new Map<string, number>();

  constructor(
    private readonly chat: ChatService,
    private readonly session: SessionService,
    private readonly jwt: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const auth = client.handshake.auth ?? {};

      if (auth.role === 'operator') {
        const payload = await this.jwt.verifyAsync(String(auth.jwt ?? ''));
        this.state.set(client.id, { role: 'operator', operatorId: payload.sub });
        client.join(OPERATORS_ROOM);
        client.emit('operator:queue', await this.chat.queue());
        return;
      }

      const conversation = await this.session.findByToken(String(auth.token ?? ''));
      if (!conversation) {
        client.emit('session:invalid');
        client.disconnect(true);
        return;
      }

      this.state.set(client.id, { role: 'child', conversationId: conversation.id });
      client.join(room(conversation.id));
      client.emit('history', await this.chat.history(conversation.id));
      client.emit('conversation:state', { status: conversation.status, alias: conversation.alias });
      this.server.to(OPERATORS_ROOM).emit('operator:queue', await this.chat.queue());
    } catch (error) {
      this.logger.warn(`Отклонено подключение: ${(error as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.state.delete(client.id);
    this.lastMessageAt.delete(client.id);
  }

  @SubscribeMessage('message:send')
  async onMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { text?: string; conversationId?: string },
  ) {
    const state = this.state.get(client.id);
    const text = String(data?.text ?? '').trim();
    if (!state || !text) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      client.emit('error:message', { reason: 'too_long', limit: MAX_MESSAGE_LENGTH });
      return;
    }

    // Простая защита от флуда: не чаще одного сообщения в 400 мс.
    const now = Date.now();
    if (now - (this.lastMessageAt.get(client.id) ?? 0) < 400) return;
    this.lastMessageAt.set(client.id, now);

    if (state.role === 'child' && state.conversationId) {
      const { message, systemMessage, risk } = await this.chat.addChildMessage(
        state.conversationId,
        text,
      );
      this.server.to(room(state.conversationId)).emit('message:new', message);
      if (systemMessage) {
        this.server.to(room(state.conversationId)).emit('message:new', systemMessage);
      }
      this.server.to(OPERATORS_ROOM).emit('operator:queue', await this.chat.queue());
      if (risk === RiskLevel.CRITICAL) {
        this.server.to(OPERATORS_ROOM).emit('operator:alert', {
          conversationId: state.conversationId,
        });
      }
      return;
    }

    if (state.role === 'operator') {
      const conversationId = String(data?.conversationId ?? '');
      if (!conversationId) return;
      const message = await this.chat.addOperatorMessage(
        conversationId,
        state.operatorId!,
        text,
      );
      this.server.to(room(conversationId)).emit('message:new', message);
      client.emit('message:new', message);
      this.server.to(OPERATORS_ROOM).emit('operator:queue', await this.chat.queue());
    }
  }

  @SubscribeMessage('typing')
  onTyping(@ConnectedSocket() client: Socket, @MessageBody() data: { isTyping?: boolean }) {
    const state = this.state.get(client.id);
    if (!state?.conversationId) return;
    client.to(room(state.conversationId)).emit('typing', { isTyping: !!data?.isTyping });
  }

  /** Психолог открыл диалог: подписывается на комнату и получает историю. */
  @SubscribeMessage('operator:open')
  async onOperatorOpen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const state = this.state.get(client.id);
    if (state?.role !== 'operator') return;

    if (state.conversationId) client.leave(room(state.conversationId));
    state.conversationId = data.conversationId;
    client.join(room(data.conversationId));
    client.emit('history', await this.chat.history(data.conversationId));
  }

  @SubscribeMessage('operator:typing')
  onOperatorTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const state = this.state.get(client.id);
    if (state?.role !== 'operator' || !data?.conversationId) return;
    client.to(room(data.conversationId)).emit('typing', { isTyping: !!data.isTyping });
  }
}
