import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
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

  const bdsFramework = await prisma.framework.upsert({
    where: { slug: "bds" },
    update: {},
    create: {
      slug: "bds",
      name: "BDS Divestment",
      defaultRules: {
        rules: {
          bds_companies: {
            type: "ticker_list",
            ruleId: "bds_companies",
            name: "BDS Complicit Companies",
            description:
              "Companies identified by the BDS movement as complicit in the Israeli occupation, apartheid, or settlements. Based on the BoyStk database and AFSC Investigate divestment shortlist.",
            bannedTickers: [
              "ACN", "MRK", "NKE", "TMO", "ABT", "CVX", "DHR", "COP", "UBER", "GILD",
              "PTC", "SLB", "ISRG", "FTNT", "APTV", "CDW", "WDC", "EW", "AKAM", "APD",
              "A", "FFIV", "BKR", "EBAY", "BIIB", "DECK", "STE", "COO", "ILMN", "DGX",
              "ICLR", "MRO", "RL", "VLTO", "J", "AVY", "DAL", "SCCO", "MCHP", "MNST",
              "ETN", "APH", "K", "EXPE", "TGT", "KMB", "JBL", "EPAM", "ABBV", "TJX",
              "PEP", "CDNS", "LLY", "WBA", "TSLA", "QCOM", "XOM", "TXN", "ROK", "PG",
              "MU", "MMM", "META", "PANW", "MSI", "AAPL", "ADI", "ADM", "ADSK", "ALGN",
              "AMAT", "AMD", "BSX", "CRM", "CSCO", "DOX", "EA", "EL", "FLEX", "FSLR",
              "FWONA", "FWONK", "GEHC", "GLW", "GOOG", "GOOGL", "HAL", "HPQ", "IFF",
              "INTC", "JNJ", "KDP", "KLAC", "KO", "MDLZ", "MDT", "MRVL", "MSFT", "NOW",
              "NWS", "NWSA", "OKTA", "OMC", "ZBRA", "NVDA", "AMZN", "AVGO", "BKNG",
              "LOW", "HON", "SYK", "ON", "VLO", "NTAP", "SOLV", "ULTA", "NXPI", "WST",
              "TTWO", "HD", "ABNB", "MCK", "VMW", "NXT", "GE", "MCD", "SBUX", "GEV",
              "DELL", "AXON", "IBM", "CCEP", "DOCU", "PVH", "CRI", "GAP", "GM", "SKX",
              "ORCL", "WDAY", "LDOS", "TEVA", "WMT", "SNDK", "T", "DLR", "HPE", "VTRS",
              "WSM", "CRWD", "STX", "TTD", "DDOG", "SUI", "CBRE", "CIEN", "TEAM", "APP",
              "GPN", "NSRGY", "SAP", "AZN", "RHHBY", "NVS", "UL", "SNY", "LRLCY",
              "ESLOY", "GSK", "RBGLY", "NOK", "ERIC", "ARM", "PSO", "RYAAY", "HNNMY",
              "HENKY", "NVO", "ADDYY", "IDEXY", "FRCOY", "RNMBY", "VWAGY", "SMMNY",
              "SMERY", "SBGSY", "SGPYY", "SGIOY", "SAABY", "HTHIY", "AIQUY", "RCRUY",
              "ATLKY", "MIELY", "HOCPY", "AMADY", "FJTSY", "DNZOY", "KNYJY", "HXGBY",
              "ATLCY", "ASCCY", "NJDCY", "MKKGY", "SYIEY", "SGAPY", "GBERY", "FANUY",
              "WRTBY", "YASKY", "ORKLY", "MHGVY", "SDVKY", "BRDCY", "NDEKY", "IFNNY",
              "GVDNY", "DSDVY", "OTSKY", "CHGCY", "CAJPY", "TOPPY", "SMGZY", "CMSQY",
              "CHT", "LZAGY", "RO.SW", "ALC.SW", "2454.TW", "005930.KS", "068270.KS",
              "012330.KS", "009150.KS", "000660.KS", "028260.KS", "267260.KS",
              "009540.KS", "373220.KS",
            ],
          },
        },
      },
    },
  });

  console.log("Seeded frameworks:", esgFramework.slug, aaoifiFramework.slug, standardFramework.slug, bdsFramework.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
