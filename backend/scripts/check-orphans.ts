import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const p = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const users = await p.user.findMany({
    where: { activeFrameworkId: { not: null } },
    select: { id: true, activeFrameworkId: true },
  });
  const ids = new Set(
    (await p.framework.findMany({ select: { id: true } })).map((f) => f.id)
  );
  const orphans = users.filter((u) => !ids.has(u.activeFrameworkId!));
  console.log(
    "users with active framework:",
    users.length,
    "| orphans:",
    orphans.length
  );
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
