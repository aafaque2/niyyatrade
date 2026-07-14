import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { IdentityController } from './identity.controller';

@Module({
  imports: [PrismaModule, ComplianceModule],
  controllers: [IdentityController],
})
export class IdentityModule {}
