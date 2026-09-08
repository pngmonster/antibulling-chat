import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OperatorService } from './operator.service';
import { OperatorController } from './operator.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      signOptions: { expiresIn: '12h' },
    }),
  ],
  controllers: [OperatorController],
  providers: [OperatorService],
})
export class OperatorModule {}
