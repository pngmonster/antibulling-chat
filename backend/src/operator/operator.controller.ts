import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString } from 'class-validator';
import { OperatorService } from './operator.service';

/**
 * При входе проверяем только то, что поля не пустые.
 * Требование к длине пароля относится к созданию учётки, а не ко входу:
 * иначе короткий пароль в .env даёт 400 вместо честного «не подошло».
 */
class LoginDto {
  @IsString()
  @IsNotEmpty()
  login!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

@Controller('operator')
export class OperatorController {
  constructor(private readonly operators: OperatorService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.operators.login(dto.login, dto.password);
  }
}
