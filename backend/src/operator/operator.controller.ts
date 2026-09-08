import { Body, Controller, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { OperatorService } from './operator.service';

class LoginDto {
  @IsString()
  @MinLength(3)
  login!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('operator')
export class OperatorController {
  constructor(private readonly operators: OperatorService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.operators.login(dto.login, dto.password);
  }
}
