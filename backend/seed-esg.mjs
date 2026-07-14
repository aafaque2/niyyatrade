import { PrismaClient } from './dist/src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const esg = await prisma.framework.upsert({
  where: { slug: 'esg' },
  update: {},
  create: {
    slug: 'esg', name: 'ESG Framework',
    defaultRules: { rules: {
      esg_carbon: { type: 'esg_sector', ruleId: 'esg_carbon', name: 'Carbon Emissions', bannedSectors: ['Energy','Utilities','Basic Materials'], description: 'Companies in high-carbon sectors.' },
      esg_weapons: { type: 'esg_sector', ruleId: 'esg_weapons', name: 'Weapons & Defense', bannedSectors: ['Industrials'], description: 'Weapons manufacturing.' },
      esg_tobacco_alcohol: { type: 'esg_sector', ruleId: 'esg_tobacco_alcohol', name: 'Tobacco & Alcohol', bannedSectors: ['Consumer Defensive'], description: 'Tobacco or alcohol.' },
      esg_employee: { type: 'esg_insufficient_data', ruleId: 'esg_employee', name: 'Employee Satisfaction', description: 'Labor practices.' },
      esg_conduct: { type: 'esg_insufficient_data', ruleId: 'esg_conduct', name: 'Ethical Conduct', description: 'Harassment, exploitation.' }
    }}
  }
});

console.log('ESG seeded:', esg.id, esg.slug);
await prisma.$disconnect();
