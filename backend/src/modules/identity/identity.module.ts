import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IdentityController } from './identity.controller';

@Module({
  imports: [PrismaModule],
  controllers: [IdentityController],
})
export class IdentityModule {}
