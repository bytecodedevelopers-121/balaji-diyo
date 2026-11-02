// One-time, non-destructive conversion of each package's legacy free-text
// includes/excludes (`packages.costIncludesText`, else the first tier's
// `costIncludes`/`costExcludes` — the same precedence the public page's
// fallback used) into ONE `package_cost_details` row per type, under a
// starter shared CostCategory ("What's Included" / "What's Excluded"). The
// row's `detailDescription` is the original rich-text HTML, kept whole (each
// category on a package is a rich-text block, not a list of single items).
// The source text columns are never touched, so this is also the rollback path.
//
// Safe to re-run: packages that already have any cost_details row are skipped.
//
// Run with:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/convert-tier-costs-to-categories.ts [--dry-run]
import 'dotenv/config';
import { CostDetailType, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const DRY_RUN = process.argv.includes('--dry-run');

const STARTERS: Record<CostDetailType, string> = { INCLUDE: "What's Included", EXCLUDE: "What's Excluded" };

/** Legacy text has CRLFs and blank-only content (`<p></p>`); keep real markup, drop empties. */
function cleanHtml(html: string | null | undefined): string | null {
  const trimmed = (html ?? '').replace(/\r/g, '').trim();
  return trimmed.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0 ? trimmed : null;
}

async function starterCategory(type: CostDetailType) {
  const existing = await prisma.costCategory.findFirst({ where: { type, name: STARTERS[type], deletedAt: null } });
  if (existing || DRY_RUN) return existing;
  return prisma.costCategory.create({ data: { name: STARTERS[type], type, sortOrder: 0 } });
}

async function main() {
  const categories = {
    INCLUDE: await starterCategory('INCLUDE'),
    EXCLUDE: await starterCategory('EXCLUDE'),
  };

  const packages = await prisma.package.findMany({
    where: { costDetails: { none: {} } },
    select: {
      id: true,
      costIncludesText: true,
      costExcludesText: true,
      tiers: { orderBy: { createdAt: 'asc' }, take: 1, select: { costIncludes: true, costExcludes: true } },
    },
  });

  let converted = 0;
  let rowsCreated = 0;
  for (const pkg of packages) {
    const sources: [CostDetailType, string | null | undefined][] = [
      ['INCLUDE', pkg.costIncludesText || pkg.tiers[0]?.costIncludes],
      ['EXCLUDE', pkg.costExcludesText || pkg.tiers[0]?.costExcludes],
    ];
    const rows = sources.flatMap(([type, text]) => {
      const html = cleanHtml(text);
      if (!html) return [];
      return [
        {
          packageId: pkg.id,
          costCategoryId: categories[type]?.id ?? null,
          detailKey: STARTERS[type],
          detailTitle: STARTERS[type],
          detailDescription: html,
          detailType: type,
          sortOrder: 0,
        },
      ];
    });
    if (rows.length === 0) continue;
    if (!DRY_RUN) await prisma.costDetail.createMany({ data: rows });
    converted += 1;
    rowsCreated += rows.length;
  }

  console.log(`${DRY_RUN ? '[dry run] would convert' : 'Converted'} ${converted}/${packages.length} packages → ${rowsCreated} rows`);
}

main().finally(() => prisma.$disconnect());
