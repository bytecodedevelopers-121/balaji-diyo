// Seeds the `about-us` CMS page (title, SEO meta, placeholder body) that
// frontend's `/company/about-us` route looks up via `GET /pages/about-us`;
// without it the route 404s. Idempotent — re-running updates the same rows.
//
// Run with:
//   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-about-us-page.ts
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const OWNER_TYPE = 'page';
const SLUG = 'about-us';

const PAGE = {
  title: 'About Us',
  content: `<h2>Built by a community</h2>
<p>Your Company was founded in Kathmandu in 2011 by a small group of local guides and porters who wanted to share the Himalaya the way they know it — unhurried, honest, and a little off the usual path.</p>
<p>Today we are a team of licensed guides, climbing Sherpas, drivers and office staff, and every trek we run still supports the villages and families along the trail.</p>
<h2>Our promise</h2>
<ul>
  <li>Small groups and fair pay for every guide and porter.</li>
  <li>Safety first: certified leaders, first-aid kits and acclimatisation built into every itinerary.</li>
  <li>Transparent pricing with no hidden costs.</li>
</ul>`,
  metaTitle: 'About Us | Your Company Nepal',
  metaKeywords: 'about your company, nepal trekking company, local guides',
  metaDescription:
    'Meet the local team behind Your Company — guiding trekkers through Nepal since 2011.',
};

async function main() {
  const existing = await prisma.urlInfo.findFirst({
    where: { ownerType: OWNER_TYPE, urlSlug: SLUG },
  });

  const { title, content, ...meta } = PAGE;
  let pageId: string;

  if (existing) {
    pageId = existing.ownerId;
    await prisma.page.update({
      where: { id: pageId },
      data: { title, content, isActive: true, deletedAt: null },
    });
  } else {
    const created = await prisma.page.create({ data: { title, content, isActive: true } });
    pageId = created.id;
    await prisma.urlInfo.create({
      data: { ownerType: OWNER_TYPE, ownerId: pageId, urlSlug: SLUG, urlTitle: title },
    });
  }

  await prisma.meta.upsert({
    where: { ownerType_ownerId: { ownerType: OWNER_TYPE, ownerId: pageId } },
    create: { ownerType: OWNER_TYPE, ownerId: pageId, ...meta },
    update: meta,
  });

  process.stdout.write(`about-us page ready (id ${pageId})\n`);
}

main()
  .catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
