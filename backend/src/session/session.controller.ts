import { Body, Controller, Delete, Post } from '@nestjs/common';
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
