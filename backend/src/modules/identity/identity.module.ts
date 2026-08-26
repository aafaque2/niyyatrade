import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { IdentityController } from './identity.controller';

@Module({
  imports: [
    PrismaModule,
    ComplianceModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as never,
        },
      }),
    }),
  ],
  controllers: [IdentityController],
})
export class IdentityModule {}
