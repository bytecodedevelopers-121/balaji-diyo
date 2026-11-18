// prisma/cleanup-last-minute.ts
//
// One-off fix: an earlier bulk update flagged EVERY upcoming departure as a
// "last minute" deal. This resets the flag on all departures, then flags only
// the 4 departures the homepage "Join Upcoming Trips" section shows (the next
// 4 upcoming, non-closed ones) and sets their status to "Open".
//
// Run the seed afterwards to restore the 9 curated deals:
//
//   npm run cleanup:last-minute
//   npm run seed:last-minute
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  const homepage = await prisma.departure.findMany({
    where: { departureDate: { gte: new Date() }, departureStatus: { not: 'closed', mode: 'insensitive' } },
    orderBy: { departureDate: 'asc' },
    take: 4,
    select: { id: true },
  });
  const ids = homepage.map((d) => d.id);

  const [unflagged, flagged] = await prisma.$transaction([
    prisma.departure.updateMany({ where: { isLastMinute: true }, data: { isLastMinute: false } }),
    prisma.departure.updateMany({ where: { id: { in: ids } }, data: { isLastMinute: true, departureStatus: 'Open' } }),
  ]);

  console.log(`Unflagged ${unflagged.count} departure(s); flagged ${flagged.count} homepage departure(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
