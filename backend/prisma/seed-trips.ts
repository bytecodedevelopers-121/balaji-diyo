// prisma/seed-trips.ts
//
// Seeds the trips (packages) that used to be generated in the frontend from
// `lib/sample-trips.ts`: the category taxonomy, 24 packages and, for each one,
// its itinerary, departures, prices, cost lists, FAQs, reviews and photos.
// Data comes from prisma/seed-data/trips-detail.json.
//
// Safe to re-run: a package whose slug already exists is left untouched, and
// categories / FAQ groups / reviews are looked up before they are created.
//
//   npm run seed:trips
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { AddOnChargeBy, AttachmentRole, CostDetailType, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const FRONTEND_PUBLIC = path.join(__dirname, '..', '..', 'frontend', 'public');
const UPLOADS_PUBLIC = path.join(__dirname, '..', 'uploads', 'public');

// ── Seed file shapes ────────────────────────────────────────────────────────
interface Card {
  id: string;
  slug: string;
  title: string;
  imageUrl?: string | null;
  duration?: number | string;
  durationType?: string;
  priceFrom?: number;
  isPopular?: boolean;
  isFeatured?: boolean;
  countries: string[];
  regions: string[];
  categories: string[];
}
interface Day {
  day: number;
  title: string;
  altitudeM: number;
  durationHours: number;
  description: string;
  locations: { label: string }[];
  lat?: number;
  lng?: number;
  distanceKm?: number;
  transport?: string;
  meals?: string;
  lunchPlace?: string;
  accommodation?: string;
}
interface CostGroup {
  category: string;
  html: string;
}
interface Detail {
  heroImages: string[];
  quickFacts: { label: string; value: string }[];
  priceFrom: number;
  intro: string;
  highlights: string[];
  overview: string;
  detailedItineraryIntro: string;
  detailedItinerary: { days: Day[] }[];
  includes: CostGroup[];
  excludes: CostGroup[];
  costTiers: { groupSize: string; pricePerPerson: number }[];
  addOns: { label: string; price: number; unit: string; chargeBy: 'PERSON' | 'ROOM' | 'FLAT'; peoplePerRoom: number }[];
  departures: { startDate: string; price: number }[];
  packingListIntro: string;
  knowBeforeYouGo: { heading: string; body: string }[];
  faqCategories: { category: string; questions: { question: string; answer: string }[] }[];
  reviews: { title: string; body: string; name: string; date: string; rating: number }[];
}
interface Trip {
  card: Card;
  detail: Detail;
}

const trips: Trip[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed-data', 'trips-detail.json'), 'utf8'));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── Taxonomy ────────────────────────────────────────────────────────────────
// Promises are cached (not results) so concurrent lookups for the same row share one write.
const typeIds = new Map<string, Promise<string>>();
function categoryType(key: string, name: string): Promise<string> {
  let pending = typeIds.get(key);
  if (!pending) {
    pending = prisma.categoryType.upsert({ where: { key }, update: {}, create: { key, name } }).then((type) => type.id);
    typeIds.set(key, pending);
  }
  return pending;
}

const categoryIds = new Map<string, Promise<string>>();
/** Finds or creates a category of one type by title; `slug` makes it a public browse page (/<slug>). */
function category(typeKey: string, title: string, options: { slug?: string; parentId?: string; order?: number } = {}): Promise<string> {
  const cacheKey = `${typeKey}|${title}`;
  let pending = categoryIds.get(cacheKey);
  if (!pending) {
    pending = createCategory(typeKey, title, options);
    categoryIds.set(cacheKey, pending);
  }
  return pending;
}

async function createCategory(typeKey: string, title: string, options: { slug?: string; parentId?: string; order?: number }) {

  const typeId = await categoryType(typeKey, typeKey.replace(/(^|-)(\w)/g, (_, a, b) => (a ? ' ' : '') + b.toUpperCase()));
  let row = await prisma.category.findFirst({ where: { typeId, title, deletedAt: null } });
  if (!row) {
    row = await prisma.category.create({ data: { title, typeId, parentId: options.parentId, categoryOrder: options.order ?? 0 } });
  }
  if (options.slug) {
    const existing = await prisma.urlInfo.findUnique({ where: { ownerType_ownerId: { ownerType: 'category', ownerId: row.id } } });
    if (!existing) await prisma.urlInfo.create({ data: { ownerType: 'category', ownerId: row.id, urlSlug: options.slug, urlTitle: title } });
  }
  return row.id;
}

/** Activity key (see TRIP_CATEGORIES in the frontend) -> browse page. */
const ACTIVITIES: Record<string, { title: string; slug: string }> = {
  trekking: { title: 'Trekking Routes in Nepal', slug: 'trekking-routes-in-nepal' },
  climbing: { title: 'Nepal Peak Climbing', slug: 'nepal-peak-climbing' },
  safari: { title: 'Nepal Tour Packages', slug: 'nepal-tour-packages' },
  tours: { title: 'Nepal Tour Packages', slug: 'nepal-tour-packages' },
  day: { title: 'Nepal Day Tours', slug: 'nepal-day-tours' },
  deals: { title: 'Last Minute Trip Deals', slug: 'last-minute-trip-deals' },
};

const COUNTRIES: Record<string, { title: string; slug: string }> = {
  Nepal: { title: 'Nepal', slug: 'nepal-tour-packages' },
  Bhutan: { title: 'Bhutan', slug: 'bhutan-tours' },
  Tibet: { title: 'Tibet', slug: 'tibet-tours' },
  'Multi Country': { title: 'Multi Country', slug: 'multi-country-tour-packages' },
};

/** Region key -> trekking region category. Their slugs match TREKKING_REGION_SLUGS in the frontend. */
const REGIONS: Record<string, { title: string; slug: string }> = {
  everest: { title: 'Everest Region', slug: 'everest-region-treks' },
  annapurna: { title: 'Annapurna Region', slug: 'annapurna-region-treks' },
  langtang: { title: 'Langtang Region', slug: 'langtang-region-treks' },
  manaslu: { title: 'Manaslu Region', slug: 'restricted-area-trekking' },
  pokhara: { title: 'Treks From Pokhara', slug: 'treks-from-pokhara' },
};

async function activityCategory(key: string) {
  const a = ACTIVITIES[key];
  return category('destination', a.title, { slug: a.slug });
}
async function countryCategory(name: string) {
  const c = COUNTRIES[name] ?? { title: name, slug: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-tour-packages` };
  // Nepal's own page is also the tours listing, so reuse that category rather than duplicating the slug.
  if (name === 'Nepal') return activityCategory('tours');
  return category('destination', c.title, { slug: c.slug });
}
async function regionCategory(key: string) {
  const r = REGIONS[key];
  const parentId = await activityCategory('trekking');
  return category('destination', r.title, { slug: r.slug, parentId });
}

// ── Media ───────────────────────────────────────────────────────────────────
async function ensureMedia(imagePath: string): Promise<string | null> {
  const source = path.join(FRONTEND_PUBLIC, imagePath);
  if (!fs.existsSync(source)) return null;
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

// ── Shared rows ─────────────────────────────────────────────────────────────
const costCategoryIds = new Map<string, string>();
async function costCategory(name: string, type: CostDetailType, sortOrder: number) {
  const key = `${type}|${name}`;
  const cached = costCategoryIds.get(key);
  if (cached) return cached;
  const found = await prisma.costCategory.findFirst({ where: { name, type, deletedAt: null } });
  const row = found ?? (await prisma.costCategory.create({ data: { name, type, sortOrder } }));
  costCategoryIds.set(key, row.id);
  return row.id;
}

const testimonialIds: string[] = [];
async function sharedTestimonials(reviews: Detail['reviews']) {
  if (testimonialIds.length > 0) return testimonialIds;
  for (const r of reviews) {
    const found = await prisma.testimonial.findFirst({ where: { fullName: r.name, reviewTitle: r.title } });
    const row =
      found ??
      (await prisma.testimonial.create({
        data: {
          fullName: r.name,
          reviewTitle: r.title,
          review: r.body,
          reviewRating: r.rating,
          reviewDate: new Date(r.date),
          countryCode: 'US',
          countryName: 'United States',
        },
      }));
    testimonialIds.push(row.id);
  }
  return testimonialIds;
}

/** "1 pax" -> 1-1, "2 - 4 pax" -> 2-4, "5 - 12 pax" -> 5-12 */
function parseGroupSize(label: string): { min: number; max: number } {
  const numbers = (label.match(/\d+/g) ?? ['1']).map(Number);
  return { min: numbers[0], max: numbers[1] ?? numbers[0] };
}

const FACT_LABELS_AS_COLUMNS = new Set(['Destination', 'Duration', 'Difficulty', 'Activity', 'Max Altitude', 'Group Size', 'Accommodation', 'Meals', 'Transport']);

async function seedTrip({ card, detail }: Trip, index: number, popularRank: number) {
  const existing = await prisma.urlInfo.findUnique({ where: { ownerType_urlSlug: { ownerType: 'package', urlSlug: card.slug } } });
  if (existing) return false;

  const fact = (label: string) => detail.quickFacts.find((f) => f.label === label)?.value;

  // Taxonomy
  const countryIds = await Promise.all(card.countries.map(countryCategory));
  const regionIds = await Promise.all(card.regions.map(regionCategory));
  const activityIds = await Promise.all(card.categories.map(activityCategory));
  const taggedIds = [...new Set([...activityIds, ...regionIds, ...countryIds])];
  const destinationId = regionIds[0] ?? countryIds[0];

  const attribute = async (typeKey: string, label: string) => {
    const value = fact(label);
    return value ? category(typeKey, value) : undefined;
  };
  const [gradeId, styleId, accommodationId, mealsId, transportationId] = await Promise.all([
    attribute('trip_gradings', 'Difficulty'),
    attribute('trip_style', 'Activity'),
    attribute('accommodation', 'Accommodation'),
    attribute('meals', 'Meals'),
    attribute('transportation', 'Transport'),
  ]);

  // FAQ categories (shared across packages)
  const faqCategoryIds = await Promise.all(detail.faqCategories.map((c, i) => category('faq-group', c.category, { order: i })));

  const testimonials = await sharedTestimonials(detail.reviews);

  const pkg = await prisma.package.create({
    data: {
      title: card.title,
      abstract: detail.intro,
      details: detail.overview,
      highlights: `<ul>${detail.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`,
      tripInfoText: detail.knowBeforeYouGo.map((k) => `<h2>${esc(k.heading)}</h2>${k.body}`).join(''),
      packingListIntro: detail.packingListIntro,
      price: detail.priceFrom,
      duration: Number(card.duration) || 1,
      durationType: card.durationType ?? 'Days',
      groupSize: fact('Group Size'),
      maxAltitude: fact('Max Altitude'),
      isFeatured: Boolean(card.isFeatured),
      isPopular: Boolean(card.isPopular),
      sortOrder: index,
      popularSortOrder: popularRank,
      destinationId,
      gradeId,
      styleId,
      accommodationId,
      mealsId,
      transportationId,
      categories: { connect: taggedIds.map((id) => ({ id })) },
      faqCategories: { connect: faqCategoryIds.map((id) => ({ id })) },
      testimonials: { connect: testimonials.map((id) => ({ id })) },
      facts: {
        create: detail.quickFacts.filter((f) => !FACT_LABELS_AS_COLUMNS.has(f.label)).map((f) => ({ factTitle: f.label, factValue: f.value })),
      },
      priceGroups: {
        create: detail.costTiers.map((tier) => {
          const { min, max } = parseGroupSize(tier.groupSize);
          return { packageTier: 'Standard', minPeople: min, maxPeople: max, unitPrice: tier.pricePerPerson, isDefault: true };
        }),
      },
      addOns: {
        create: detail.addOns.map((a) => ({
          addonTitle: a.label,
          addonPrice: a.price,
          addonUnit: a.unit,
          chargeBy: a.chargeBy as AddOnChargeBy,
          peoplePerRoom: a.peoplePerRoom,
        })),
      },
      departures: {
        create: detail.departures.map((d) => ({ departureDate: new Date(d.startDate), departureCost: d.price, departureStatus: 'available' })),
      },
    },
  });

  await prisma.urlInfo.create({ data: { ownerType: 'package', ownerId: pkg.id, urlSlug: card.slug, urlTitle: card.title } });

  // Included / excluded lists
  for (const [type, groups] of [
    [CostDetailType.INCLUDE, detail.includes],
    [CostDetailType.EXCLUDE, detail.excludes],
  ] as const) {
    for (const [i, group] of groups.entries()) {
      await prisma.costDetail.create({
        data: {
          packageId: pkg.id,
          costCategoryId: await costCategory(group.category, type, i),
          sortOrder: i,
          detailKey: group.category,
          detailTitle: group.category,
          detailDescription: group.html,
          detailType: type,
        },
      });
    }
  }

  // Itinerary
  const days = detail.detailedItinerary[0]?.days ?? [];
  const itinerary = await prisma.itinerary.create({ data: { packageId: pkg.id, title: card.title, detailsText: detail.detailedItineraryIntro } });
  let previous: Day | undefined;
  for (const [i, day] of days.entries()) {
    const coordinate = (d?: Day) => (d && d.lat !== undefined && d.lng !== undefined ? `${d.lat},${d.lng}` : undefined);
    await prisma.itineraryDetail.create({
      data: {
        itineraryId: itinerary.id,
        sortOrder: i,
        itineraryDay: String(day.day),
        itineraryTitle: day.title,
        itineraryDescription: `<p>${esc(day.description)}</p>`,
        origin: previous?.locations.at(-1)?.label ?? day.locations[0]?.label,
        originCoordinate: coordinate(previous),
        originElevation: previous ? String(previous.altitudeM) : undefined,
        destination: day.locations.at(-1)?.label,
        destinationCoordinate: coordinate(day),
        destinationElevation: String(day.altitudeM),
        duration: day.durationHours ? `${day.durationHours} Hours` : undefined,
        distance: day.distanceKm !== undefined ? String(day.distanceKm) : undefined,
        travelMode: day.transport,
        meals: day.meals,
        lunchPlace: day.lunchPlace,
        accommodation: day.accommodation,
      },
    });
    previous = day;
  }

  // FAQs: one set per package, grouped by the shared FAQ categories
  for (const [ci, group] of detail.faqCategories.entries()) {
    for (const [qi, q] of group.questions.entries()) {
      await prisma.groupFAQ.create({
        data: {
          question: q.question,
          answer: `<p>${esc(q.answer)}</p>`,
          faqOrder: qi,
          categories: { connect: [{ id: faqCategoryIds[ci] }] },
          packages: { connect: [{ id: pkg.id }] },
        },
      });
    }
  }

  // Photos: first image is the card/hero photo, the rest fill the gallery
  const photos = [...new Set([card.imageUrl, ...detail.heroImages].filter((p): p is string => Boolean(p)))];
  for (const [i, photo] of photos.entries()) {
    const mediaId = await ensureMedia(photo);
    if (mediaId) {
      await prisma.attachment.create({
        data: { mediaId, ownerType: 'package', ownerId: pkg.id, role: i === 0 ? AttachmentRole.FEATURED : AttachmentRole.GALLERY, sortOrder: i },
      });
    }
  }

  return true;
}

async function main() {
  let created = 0;
  let popularRank = 0;
  for (const [index, trip] of trips.entries()) {
    const rank = trip.card.isPopular ? popularRank++ : 0;
    if (await seedTrip(trip, index, rank)) {
      created += 1;
      console.log(`  + ${trip.card.slug}`);
    }
  }
  console.log(`trips: ${created} created, ${trips.length - created} already present`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
