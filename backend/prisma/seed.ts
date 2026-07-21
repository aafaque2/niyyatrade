import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const esgFramework = await prisma.framework.upsert({
    where: { slug: "esg" },
    update: {},
    create: {
      slug: "esg",
      name: "ESG Framework",
      defaultRules: {
        rules: {
          esg_carbon: {
            type: "esg_sector",
            ruleId: "esg_carbon",
            name: "Carbon Emissions",
            bannedSectors: ["Energy", "Utilities", "Basic Materials"],
            description:
              "Companies in high-carbon sectors are flagged for environmental concern.",
          },
          esg_weapons: {
            type: "esg_sector",
            ruleId: "esg_weapons",
            name: "Weapons & Defense",
            bannedSectors: ["Industrials"],
            description:
              "Companies involved in weapons manufacturing or defense contracting.",
          },
          esg_tobacco_alcohol: {
            type: "esg_sector",
            ruleId: "esg_tobacco_alcohol",
            name: "Tobacco & Alcohol",
            bannedSectors: ["Consumer Defensive"],
            description:
              "Companies involved in tobacco or alcohol production.",
          },
          esg_employee: {
            type: "esg_insufficient_data",
            ruleId: "esg_employee",
            name: "Employee Satisfaction",
            description:
              "Evaluates labor practices, fair wages, and workplace safety.",
          },
          esg_conduct: {
            type: "esg_insufficient_data",
            ruleId: "esg_conduct",
            name: "Ethical Conduct",
            description:
              "Screens for sexual harassment, labor exploitation, and environmental violations.",
          },
        },
      },
    },
  });

  const aaoifiFramework = await prisma.framework.upsert({
    where: { slug: "halal-aaoifi" },
    update: {},
    create: {
      slug: "halal-aaoifi",
      name: "AAOIFI",
      defaultRules: {
        rules: {
          sector_screen: {
            type: "sector",
            ruleId: "sector_screen",
            name: "Industry Screening",
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
            ruleId: "debt_to_equity",
            name: "Debt-to-Equity",
            operator: "less_than",
            threshold: 33.33,
            description:
              "Total Debt cannot exceed 33.33% of Trailing 12-Month Average Market Cap.",
          },
          interest_income: {
            type: "percentage",
            ruleId: "interest_income",
            name: "Interest Income",
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
      name: "Standard",
      defaultRules: {
        rules: {},
      },
    },
  });

  console.log("Seeded frameworks:", esgFramework.slug, aaoifiFramework.slug, standardFramework.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
