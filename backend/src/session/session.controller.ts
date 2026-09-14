import { Body, Controller, Delete, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsString, Length } from 'class-validator';
import { SessionService } from './session.service';

class TokenDto {
  @IsString()
  @Length(64, 64)
  token!: string;
}

@Controller('session')
export class SessionController {
  constructor(private readonly session: SessionService) {}

  /** Вызывается один раз при первом заходе ребёнка. Никаких персональных данных. */
  // Запас на школьный NAT: за одним внешним адресом могут сидеть десятки детей.
  @Throttle({ default: { limit: 30, ttl: 600_000 } })
  @Post()
  async create() {
    const { token, conversation } = await this.session.create();
    return { token, conversationId: conversation.id, alias: conversation.alias };
  }

  @Delete()
  async purge(@Body() dto: TokenDto) {
    const deleted = await this.session.purge(dto.token);
    return { deleted };
  }
}
