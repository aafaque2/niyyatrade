import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const halalFramework = await prisma.framework.upsert({
    where: { slug: "halal-aaoifi" },
    update: {},
    create: {
      slug: "halal-aaoifi",
      name: "AAOIFI Halal Standard",
      defaultRules: {
        rules: {
          sector_screen: {
            type: "sector",
            operator: "not_in",
            bannedSectors: [
              "Conventional Financials",
              "Alcohol",
              "Gambling",
              "Adult Entertainment",
              "Tobacco",
              "Defense",
            ],
            description:
              "The core business of the company must not be in an impermissible industry.",
          },
          debt_to_equity: {
            type: "percentage",
            operator: "less_than",
            threshold: 33.33,
            description:
              "Total Debt cannot exceed 33.33% of Trailing 12-Month Average Market Cap.",
          },
          interest_income: {
            type: "percentage",
            operator: "less_than",
            threshold: 5.0,
            description:
              "Interest income must be less than 5% of total revenue.",
          },
        },
      },
    },
  });

  const standardFramework = await prisma.framework.upsert({
    where: { slug: "standard" },
    update: {},
    create: {
      slug: "standard",
      name: "Standard Framework",
      defaultRules: {
        rules: {},
      },
    },
  });

  console.log("Seeded frameworks:", halalFramework.slug, standardFramework.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
