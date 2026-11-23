// prisma/seed-b2b-tiers.ts
// Idempotent: safe to run repeatedly in dev/staging/prod. Upserts by unique
// `code` / `name` and never overwrites an existing row (`update: {}`), so
// values an admin has tuned in the console survive a re-run.
import "dotenv/config";
import { PrismaClient, B2BRateType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Lowest priorityOrder = entry tier assigned to new registrations.
const tiers = [
  { code: "BRONZE", name: "Bronze", priorityOrder: 1, defaultRateType: B2BRateType.COMMISSIONABLE, defaultCommissionPct: "8.00", defaultCreditLimit: "0", creditTermDays: 0, holdDurationMinutes: 30, slaResponseHours: 24 },
  { code: "SILVER", name: "Silver", priorityOrder: 2, defaultRateType: B2BRateType.COMMISSIONABLE, defaultCommissionPct: "10.00", defaultCreditLimit: "5000", creditTermDays: 15, holdDurationMinutes: 60, slaResponseHours: 12 },
  { code: "GOLD", name: "Gold", priorityOrder: 3, defaultRateType: B2BRateType.COMMISSIONABLE, defaultCommissionPct: "12.50", defaultCreditLimit: "20000", creditTermDays: 30, holdDurationMinutes: 120, slaResponseHours: 6 },
  { code: "STRATEGIC", name: "Strategic", priorityOrder: 4, defaultRateType: B2BRateType.NET, defaultCommissionPct: "15.00", defaultCreditLimit: "50000", creditTermDays: 45, holdDurationMinutes: 240, slaResponseHours: 2 },
];

// Partner users need a Role row (User.roleId is required). It carries no
// admin permissions — partner access is governed by b2bRole + partner status.
const PARTNER_ROLE_NAME = "B2B Partner";

async function main() {
  for (const t of tiers) {
    await prisma.b2BPartnerTier.upsert({ where: { code: t.code }, update: {}, create: t });
    console.log(`✅ Tier ready: ${t.code}`);
  }
  await prisma.role.upsert({
    where: { name: PARTNER_ROLE_NAME },
    update: {},
    create: { name: PARTNER_ROLE_NAME, description: "B2B agency user (no internal permissions)", isSystem: true },
  });
  console.log(`✅ Role ready: ${PARTNER_ROLE_NAME}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
