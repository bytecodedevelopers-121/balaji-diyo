// prisma/seed-content.ts
//
// Seeds the site content that used to be hardcoded in the frontend
// (destinations, travel guides, web stories, blogs, team members). Data lives
// in prisma/seed-data/*.json. Safe to re-run: every row is looked up by its slug
// and created or updated, never duplicated, and nothing is deleted.
//
//   npm run seed:content
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, AttachmentRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const DATA_DIR = path.join(__dirname, 'seed-data');
const FRONTEND_PUBLIC = path.join(__dirname, '..', '..', 'frontend', 'public');
const UPLOADS_PUBLIC = path.join(__dirname, '..', 'uploads', 'public');

const read = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8')) as T;
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── Types of the JSON files ─────────────────────────────────────────────────
interface DestinationJson { slug: string; name: string; countryLabel: string; heroImage: string; intro: string; cards: unknown[]; contentHtml: string }
interface TopicJson { slug: string; title: string; image: string; summary: string; intro?: string[]; sections: unknown[] }
interface GuideJson { slug: string; country: string; title: string; image: string; summary: string; topics: TopicJson[] }
interface StoryJson { slug: string; title: string; cover: string; slides: unknown[] }
interface BlogJson { title: string; abstract: string | null; content: string; blogDate: string; slug: string; authors: { name: string }[]; categories: { id: string; title: string }[]; imageUrl: string | null }
interface TeamJson { fullName: string; position: string; positionOrder: number; photoUrl: string | null; memberPhone: string | null; memberEmail: string | null; description: string; slug: string | null }

/** Copies a frontend /images/... file into uploads/public/seed and returns its Media row id. */
async function ensureMedia(imagePath: string): Promise<string | null> {
  const source = path.join(FRONTEND_PUBLIC, imagePath);
  if (!fs.existsSync(source)) {
    console.warn(`  ! image not found, skipped: ${imagePath}`);
    return null;
  }
  const fileName = path.basename(imagePath);
  const storagePath = `seed/${fileName}`;
  fs.mkdirSync(path.join(UPLOADS_PUBLIC, 'seed'), { recursive: true });
  fs.copyFileSync(source, path.join(UPLOADS_PUBLIC, storagePath));

  const existing = await prisma.media.findFirst({ where: { fullPath: storagePath } });
  if (existing) return existing.id;
  const ext = path.extname(fileName).slice(1).toLowerCase();
  const media = await prisma.media.create({
    data: { fullName: fileName, fullPath: storagePath, extension: ext, mime: ext === 'png' ? 'image/png' : 'image/jpeg' },
  });
  return media.id;
}

async function seedDestinations() {
  const rows = read<DestinationJson[]>('destinations.json');
  for (const [i, d] of rows.entries()) {
    const data = { name: d.name, countryLabel: d.countryLabel, heroImage: d.heroImage, intro: d.intro, cards: d.cards as object, contentHtml: d.contentHtml, sortOrder: i };
    await prisma.destination.upsert({ where: { slug: d.slug }, update: data, create: { slug: d.slug, ...data } });
  }
  console.log(`destinations: ${rows.length}`);
}

async function seedTravelGuides() {
  const rows = read<GuideJson[]>('travel-guides.json');
  let topics = 0;
  for (const [i, g] of rows.entries()) {
    const data = { country: g.country, title: g.title, image: g.image, summary: g.summary, sortOrder: i };
    const guide = await prisma.travelGuide.upsert({ where: { slug: g.slug }, update: data, create: { slug: g.slug, ...data } });
    for (const [j, t] of g.topics.entries()) {
      const topic = { title: t.title, image: t.image, summary: t.summary, intro: t.intro ?? undefined, sections: t.sections as object, sortOrder: j };
      await prisma.travelGuideTopic.upsert({
        where: { guideId_slug: { guideId: guide.id, slug: t.slug } },
        update: topic,
        create: { guideId: guide.id, slug: t.slug, ...topic },
      });
      topics += 1;
    }
  }
  console.log(`travel guides: ${rows.length} (${topics} topics)`);
}

async function seedWebStories() {
  const rows = read<StoryJson[]>('web-stories.json');
  for (const [i, s] of rows.entries()) {
    const data = { title: s.title, cover: s.cover, slides: s.slides as object, sortOrder: i };
    await prisma.webStory.upsert({ where: { slug: s.slug }, update: data, create: { slug: s.slug, ...data } });
  }
  console.log(`web stories: ${rows.length}`);
}

async function seedBlogs() {
  const posts = read<BlogJson[]>('blogs.json');
  const blogType = await prisma.categoryType.upsert({ where: { key: 'blog' }, update: {}, create: { key: 'blog', name: 'Blog' } });

  const author = await prisma.blogAuthor.upsert({
    where: { email: 'arjun@joyfultrekking.com' },
    update: {},
    create: { name: 'Arjun', email: 'arjun@joyfultrekking.com', description: 'Trekking guide and writer at Joyful Trekking.' },
  });

  const categoryIds = new Map<string, string>();
  for (const post of posts) {
    for (const c of post.categories) {
      if (categoryIds.has(c.id)) continue;
      const found = await prisma.category.findFirst({ where: { typeId: blogType.id, title: c.title, deletedAt: null } });
      const category = found ?? (await prisma.category.create({ data: { title: c.title, typeId: blogType.id } }));
      categoryIds.set(c.id, category.id);
    }
  }

  for (const post of posts) {
    const existing = await prisma.urlInfo.findUnique({ where: { ownerType_urlSlug: { ownerType: 'blog', urlSlug: post.slug } } });
    const fields = { title: post.title, abstract: post.abstract, content: post.content, blogDate: new Date(post.blogDate) };
    const relations = {
      authors: { set: [{ id: author.id }] },
      categories: { set: post.categories.map((c) => ({ id: categoryIds.get(c.id)! })) },
    };

    let blogId: string;
    if (existing) {
      blogId = existing.ownerId;
      await prisma.blog.update({ where: { id: blogId }, data: { ...fields, ...relations } });
    } else {
      const blog = await prisma.blog.create({
        data: { ...fields, authors: { connect: [{ id: author.id }] }, categories: { connect: post.categories.map((c) => ({ id: categoryIds.get(c.id)! })) } },
      });
      blogId = blog.id;
      await prisma.urlInfo.create({ data: { ownerType: 'blog', ownerId: blogId, urlSlug: post.slug, urlTitle: post.title } });
    }

    if (post.imageUrl) {
      const already = await prisma.attachment.findFirst({ where: { ownerType: 'blog', ownerId: blogId, role: AttachmentRole.FEATURED } });
      if (!already) {
        const mediaId = await ensureMedia(post.imageUrl);
        if (mediaId) await prisma.attachment.create({ data: { mediaId, role: AttachmentRole.FEATURED, ownerType: 'blog', ownerId: blogId } });
      }
    }
  }
  console.log(`blogs: ${posts.length} (${categoryIds.size} categories)`);
}

async function seedTeam() {
  const members = read<TeamJson[]>('team.json');
  for (const m of members) {
    const slug = m.slug ?? slugify(m.fullName);
    const data = {
      fullName: m.fullName,
      position: m.position,
      positionOrder: m.positionOrder,
      photoUrl: m.photoUrl,
      memberPhone: m.memberPhone,
      memberEmail: m.memberEmail,
      description: m.description,
      countryCode: 'NP',
      countryName: 'Nepal',
      memberAddress: 'Kathmandu, Nepal',
    };
    const existing = await prisma.urlInfo.findUnique({ where: { ownerType_urlSlug: { ownerType: 'team-member', urlSlug: slug } } });
    if (existing) {
      await prisma.teamMember.update({ where: { id: existing.ownerId }, data });
    } else {
      const created = await prisma.teamMember.create({ data });
      await prisma.urlInfo.create({ data: { ownerType: 'team-member', ownerId: created.id, urlSlug: slug, urlTitle: m.fullName } });
    }
  }
  console.log(`team members: ${members.length}`);
}

/** Homepage "Client Reviews": three featured testimonials. */
async function seedClientReviews() {
  const reviews = [
    { fullName: 'Mark', countryCode: 'AU', countryName: 'Australia', reviewDate: '2026-05-31', reviewTitle: 'A rewarding Annapurna adventure with comfortable stays', review: 'I completed the Comfort Annapurna Circuit Trek in May 2026. For me, the appeal was combining the mountain experience with more comfortable accommodation where available, and our guide looked after the group really well.' },
    { fullName: 'Katie Marquis', countryCode: 'AU', countryName: 'Australia', reviewDate: '2026-05-13', reviewTitle: 'Amazing experience', review: 'Our trekking guide was Saroj and our porter was Uttam. They were both amazing. The hike itself was sweaty work but so worth it. Unfortunately it was too cloudy to see the peaks.' },
    { fullName: 'Debz', countryCode: 'AU', countryName: 'Australia', reviewDate: '2026-04-12', reviewTitle: 'Magical memories - Poon Hill Trek with Chitwan Jungle Safari', review: 'Incredible experience combining Kathmandu, the Poon Hill trek and Chitwan jungle safari. The trek offered stunning Himalayan views, beautiful villages, and well-managed trails.' },
  ];
  for (const r of reviews) {
    const existing = await prisma.testimonial.findFirst({ where: { fullName: r.fullName, reviewTitle: r.reviewTitle } });
    if (existing) {
      await prisma.testimonial.update({ where: { id: existing.id }, data: { isFeatured: true } });
    } else {
      await prisma.testimonial.create({ data: { ...r, reviewDate: new Date(r.reviewDate), reviewRating: 5, isFeatured: true } });
    }
  }
  console.log(`client reviews: ${reviews.length}`);
}

/** The "Legal Documents" grid. Titles only; scans are uploaded in the admin panel. */
async function seedCompanyDocuments() {
  const titles = [
    'Company Registration Certificate',
    'Tourism Business Licence',
    'Business Registration Certificate',
    'VAT Registration Certificate',
    "Trekking Agencies' Association Membership",
    'Mountaineering Association Membership',
    'Nepal Tourism Board Registration',
  ];
  for (const [i, title] of titles.entries()) {
    const existing = await prisma.companyDocument.findFirst({ where: { title, deletedAt: null } });
    if (!existing) await prisma.companyDocument.create({ data: { title, sortOrder: i + 1 } });
  }
  console.log(`company documents: ${titles.length}`);
}

async function main() {
  await seedDestinations();
  await seedTravelGuides();
  await seedWebStories();
  await seedBlogs();
  await seedTeam();
  await seedClientReviews();
  await seedCompanyDocuments();
  console.log('Content seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
