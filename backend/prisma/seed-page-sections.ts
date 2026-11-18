// prisma/seed-page-sections.ts
//
// Loads the website's current page copy into the page-content CMS (admin → Page
// Content) so the admin starts with the real data. The source of truth is the
// frontend's own defaults file, so what the site shows today is exactly what the
// admin shows. Safe to re-run: a section that already exists is left untouched
// (admin edits are never overwritten) unless you pass --reset.
//
//   npm run seed:page-sections            # add missing sections
//   npm run seed:page-sections -- --reset # overwrite every section with the defaults
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

// The website's own defaults are the source of truth. On a server that only has the backend folder
// (no frontend/ next to it) the copies in prisma/seed-data/page-content are used instead — refresh them
// with `cp ../frontend/src/features/page-content/*.json prisma/seed-data/page-content/` after editing the originals.
const FRONTEND_DEFAULTS = path.join(__dirname, '..', '..', 'frontend', 'src', 'features', 'page-content');
const DEFAULTS_DIR = fs.existsSync(FRONTEND_DEFAULTS) ? FRONTEND_DEFAULTS : path.join(__dirname, 'seed-data', 'page-content');
const reset = process.argv.includes('--reset');

/** page key → defaults file. Add a line here when another page is moved into the CMS. */
const PAGES: Record<string, string> = {
  home: 'home-defaults.json',
  contact: 'contact-defaults.json',
  footer: 'footer-defaults.json',
  site: 'site-defaults.json',
};

/** Global Settings keys behind the "site" page, so the admin starts with what the website shows today. */
const SITE_CONTACT_KEYS: Record<string, string> = {
  address: 'address',
  email: 'email',
  phone: 'phone',
  secondaryPhone: 'secondary_phone',
  mobile: 'mobile',
};
const SITE_SOCIAL_KEYS: Record<string, string> = {
  Facebook: 'facebook',
  X: 'twitter',
  Instagram: 'instagram',
  LinkedIn: 'linkedin',
  YouTube: 'youtube',
  Pinterest: 'pinterest',
  TikTok: 'tiktok',
};

/** Overlays live Global Settings values on the "site" defaults (contact details and social links). */
async function withLiveSiteSettings(sections: Record<string, Prisma.InputJsonValue>) {
  const rows = await prisma.globalSetting.findMany({ where: { deletedAt: null, isActive: true } });
  const value = (key: string) => rows.find((r) => r.key === key)?.value?.trim() || undefined;

  const contact = { ...(sections.contact as Record<string, string>) };
  for (const [field, key] of Object.entries(SITE_CONTACT_KEYS)) contact[field] = value(key) ?? contact[field];

  const defaults = (sections.social as { links: { label: string; href: string }[] }).links;
  const links = defaults.map((link) => ({ label: link.label, href: value(SITE_SOCIAL_KEYS[link.label] ?? '') ?? link.href }));
  return { ...sections, contact, social: { links } };
}

async function main() {
  for (const [pageKey, file] of Object.entries(PAGES)) {
    let sections = JSON.parse(fs.readFileSync(path.join(DEFAULTS_DIR, file), 'utf8')) as Record<string, Prisma.InputJsonValue>;
    if (pageKey === 'site') sections = await withLiveSiteSettings(sections);
    let order = 0;
    for (const [sectionKey, content] of Object.entries(sections)) {
      const existing = await prisma.pageSection.findUnique({ where: { pageKey_sectionKey: { pageKey, sectionKey } } });
      if (existing && !reset) {
        console.log(`  = ${pageKey}/${sectionKey} (kept)`);
      } else {
        await prisma.pageSection.upsert({
          where: { pageKey_sectionKey: { pageKey, sectionKey } },
          create: { pageKey, sectionKey, content, sortOrder: order },
          update: { content, sortOrder: order },
        });
        console.log(`  + ${pageKey}/${sectionKey}`);
      }
      order += 1;
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
