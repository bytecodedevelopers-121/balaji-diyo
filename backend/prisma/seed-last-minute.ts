// prisma/seed-last-minute.ts
//
// Seeds the "Last Minute Trip Deals" departures that used to be the hard-coded
// placeholder rows in the frontend's DepartureTable. Each row becomes a real
// `package_departures` record flagged `isLastMinute`, attached to the package
// whose title matches. Rows whose package doesn't exist are skipped (reported).
//
// Safe to re-run: a departure for the same package + date is left untouched.
//
//   npm run seed:last-minute
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

interface Deal {
  title: string;
  date: string; // YYYY-MM-DD (UTC)
  cost: number;
  status: string;
}

// Dates moved forward from the old Aug–Oct 2026 placeholders so they are
// upcoming (the public lists only show today-or-later departures).
const DEALS: Deal[] = [
  { title: 'Everest Base Camp Trek', date: '2026-12-10', cost: 1300, status: 'Open' },
  { title: 'Everest Base Camp Trek With Helicopter Return', date: '2026-12-14', cost: 2100, status: 'Open' },
  { title: 'Short Everest Base Camp Trek', date: '2026-12-20', cost: 1100, status: 'Open' },
  { title: 'Short Annapurna Base Camp Trek', date: '2027-01-04', cost: 900, status: 'Open' },
  { title: 'Short Everest Base Camp Trek', date: '2027-01-10', cost: 1100, status: 'Open' },
  { title: 'Everest Base Camp Trek', date: '2027-01-18', cost: 1300, status: 'Open' },
  { title: 'Everest Base Camp Trek With Helicopter Return', date: '2027-01-24', cost: 2100, status: 'Open' },
  { title: 'Short Everest Base Camp Trek', date: '2027-02-01', cost: 1100, status: 'Open' },
  { title: 'Short Annapurna Base Camp Trek', date: '2027-02-08', cost: 900, status: 'Open' },
];

// The placeholder titles that have no package of their own map to the closest
// real package in the catalogue.
const TITLE_FALLBACK: Record<string, string> = {
  'Everest Base Camp Trek With Helicopter Return': 'Everest Base Camp Helicopter Tour with Landing',
  'Short Everest Base Camp Trek': 'Everest Base Camp Trek',
  'Short Annapurna Base Camp Trek': 'Annapurna Base Camp Trek',
};

async function findPackage(title: string) {
  const find = (t: string) =>
    prisma.package.findFirst({ where: { title: { equals: t, mode: 'insensitive' } }, select: { id: true } });
  const exact = await find(title);
  if (exact) return exact;
  const fallback = TITLE_FALLBACK[title];
  return fallback ? find(fallback) : null;
}

async function main() {
  let created = 0;
  let updated = 0;
  const missing = new Set<string>();

  for (const deal of DEALS) {
    const pkg = await findPackage(deal.title);
    if (!pkg) {
      missing.add(deal.title);
      continue;
    }

    const departureDate = new Date(`${deal.date}T00:00:00.000Z`);
    const existing = await prisma.departure.findFirst({ where: { packageId: pkg.id, departureDate } });
    if (existing) {
      if (!existing.isLastMinute) {
        await prisma.departure.update({
          where: { id: existing.id },
          data: { isLastMinute: true, departureStatus: deal.status },
        });
        updated += 1;
      }
      continue;
    }

    await prisma.departure.create({
      data: {
        packageId: pkg.id,
        departureDate,
        departureCost: deal.cost,
        departureStatus: deal.status,
        isLastMinute: true,
      },
    });
    created += 1;
  }

  console.log(`Last-minute departures: ${created} created, ${updated} flagged, ${missing.size} package(s) not found.`);
  if (missing.size > 0) console.log(`Missing packages (create them in admin first): ${[...missing].join('; ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
