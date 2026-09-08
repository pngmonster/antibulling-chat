import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OperatorService implements OnModuleInit {
  private readonly logger = new Logger(OperatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** При первом запуске создаём учётку психолога из переменных окружения. */
  async onModuleInit() {
    const login = process.env.OPERATOR_LOGIN;
    const password = process.env.OPERATOR_PASSWORD;
    if (!login || !password) return;

    const existing = await this.prisma.operator.findUnique({ where: { login } });
    if (existing) return;

    await this.prisma.operator.create({
      data: {
        login,
        passwordHash: await bcrypt.hash(password, 12),
        displayName: process.env.OPERATOR_NAME ?? 'Психолог',
      },
    });
    this.logger.log(`Создана учётная запись психолога: ${login}`);
  }

  async login(login: string, password: string) {
    const operator = await this.prisma.operator.findUnique({ where: { login } });
    if (!operator || !operator.isActive) throw new UnauthorizedException('Неверный логин или пароль');

    const ok = await bcrypt.compare(password, operator.passwordHash);
    if (!ok) throw new UnauthorizedException('Неверный логин или пароль');

    const token = await this.jwt.signAsync({ sub: operator.id, name: operator.displayName });
    return { token, displayName: operator.displayName };
  }
}
