// One-time legacy-data ETL orchestrator. Run with:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/legacy-import/index.ts
// Requires: the legacy dump loaded into a local MySQL reachable at
// 127.0.0.1:33061 (see db.ts), and DATABASE_URL pointing at the target
// (already-migrated, already-seeded) Postgres dev DB.
import { queryAll, closeAll } from './db';
import { report } from './report';
import { importTaxonomy } from './phases/01-taxonomy';
import { importContent } from './phases/02-content';
import { importPackages } from './phases/03-package';
import { importBookingsAndPayments } from './phases/04-booking-payment';
import { importAdminsAndActivity } from './phases/05-admin-activity';
import { importMedia } from './phases/06-media';
import { importMetaAndUrl } from './phases/07-meta-url';

async function getAllTableCounts(): Promise<Record<string, number>> {
  // information_schema.tables reports TABLE_NAME in uppercase on this MySQL
  // version — alias to a fixed-case key rather than relying on the source
  // column's casing.
  const tableRows = await queryAll<{ t: string }>(
    `SELECT table_name AS t FROM information_schema.tables WHERE table_schema = 'boundless_legacy'`,
  );
  const counts: Record<string, number> = {};
  for (const { t } of tableRows) {
    const rows = await queryAll<{ c: number }>(`SELECT COUNT(*) AS c FROM \`${t}\``);
    counts[t] = rows[0].c;
  }
  return counts;
}

async function main(): Promise<void> {
  console.log('🚚 Starting legacy import...\n');

  console.log('--- Phase 1: taxonomy ---');
  await importTaxonomy();
  console.log('--- Phase 2: content ---');
  await importContent();
  console.log('--- Phase 3: packages ---');
  await importPackages();
  console.log('--- Phase 4: bookings/payments/contact ---');
  await importBookingsAndPayments();
  console.log('--- Phase 5: admins/activity log ---');
  await importAdminsAndActivity();
  console.log('--- Phase 6: media ---');
  await importMedia();
  console.log('--- Phase 7: meta/url ---');
  await importMetaAndUrl();

  // Laravel-internal tables with no equivalent in the new JWT-based auth /
  // job-queue-free backend — out of scope by design, not an oversight.
  report.skip('oauth_access_tokens', 0, 'Laravel Passport OAuth — not used by the new JWT auth');
  report.skip('oauth_clients', 0, 'Laravel Passport OAuth — not used by the new JWT auth');
  report.skip('oauth_personal_access_clients', 0, 'Laravel Passport OAuth — not used by the new JWT auth');

  report.print();

  // Safety net: any legacy table with rows that no phase explicitly reported
  // on gets flagged instead of silently vanishing.
  const allCounts = await getAllTableCounts();
  const reported = new Set(report.tables());
  const unaccounted = Object.entries(allCounts).filter(
    ([table, count]) => count > 0 && !reported.has(table),
  );
  if (unaccounted.length > 0) {
    console.log('\n⚠️  Tables with legacy rows that NO phase reported on:');
    for (const [table, count] of unaccounted) console.log(`  ${table}: ${count} rows`);
  } else {
    console.log('\n✅ Every legacy table with rows was accounted for by some phase.');
  }
}

main()
  .catch((err) => {
    console.error('\n❌ Import failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeAll();
  });
