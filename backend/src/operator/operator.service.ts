import { Injectable, Logger, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

const MIN_PASSWORD_LENGTH = 8;

@Injectable()
export class OperatorService implements OnModuleInit {
  private readonly logger = new Logger(OperatorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Учётка психолога синхронизируется с .env при каждом старте.
   * Раньше она создавалась только один раз, и смена пароля в .env
   * ничего не меняла — в базе оставался старый хеш.
   */
  async onModuleInit() {
    const login = process.env.OPERATOR_LOGIN?.trim();
    const password = process.env.OPERATOR_PASSWORD;
    const displayName = process.env.OPERATOR_NAME?.trim() || 'Психолог';

    if (!login || !password) {
      this.logger.warn(
        'OPERATOR_LOGIN или OPERATOR_PASSWORD не заданы — вход в панель психолога работать не будет',
      );
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      this.logger.error(
        `Пароль психолога короче ${MIN_PASSWORD_LENGTH} символов. Учётка не создана — задай длиннее в .env`,
      );
      return;
    }

    const existing = await this.prisma.operator.findUnique({ where: { login } });

    if (!existing) {
      await this.prisma.operator.create({
        data: { login, passwordHash: await bcrypt.hash(password, 12), displayName },
      });
      this.logger.log(`Создана учётная запись психолога: ${login}`);
      return;
    }

    const matches = await bcrypt.compare(password, existing.passwordHash);
    if (matches && existing.displayName === displayName && existing.isActive) {
      this.logger.log(`Учётная запись психолога готова: ${login}`);
      return;
    }

    await this.prisma.operator.update({
      where: { login },
      data: {
        passwordHash: matches ? existing.passwordHash : await bcrypt.hash(password, 12),
        displayName,
        isActive: true,
      },
    });
    this.logger.log(`Учётная запись психолога обновлена из .env: ${login}`);
  }

  async login(login: string, password: string) {
    const operator = await this.prisma.operator.findUnique({ where: { login: login.trim() } });

    if (!operator || !operator.isActive) {
      this.logger.warn(`Неудачный вход: логин "${login}" не найден или отключён`);
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const ok = await bcrypt.compare(password, operator.passwordHash);
    if (!ok) {
      this.logger.warn(`Неудачный вход: неверный пароль для "${login}"`);
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const token = await this.jwt.signAsync({ sub: operator.id, name: operator.displayName });
    return { token, displayName: operator.displayName };
  }
}
