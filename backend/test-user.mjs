import { PrismaClient } from './dist/src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

process.env.DATABASE_URL = 'postgresql://halaltrade:halaltrade_dev@localhost:5432/halaltrade?schema=public';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

try {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('users:', JSON.stringify(users));
} catch (e) {
  console.error('ERROR:', e.message);
  console.error(e.stack);
} finally {
  await prisma.$disconnect();
}
