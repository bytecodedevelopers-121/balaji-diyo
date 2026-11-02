import { prisma, queryAll, bool, nullIfEmpty } from '../db';
import { idMap } from '../id-map';
import { report } from '../report';
import { toJsonOrWrap } from '../utils';

interface PackageRow {
  id: number;
  package_title: string;
  package_abstract: string | null;
  package_details: string | null;
  package_highlights: string | null;
  package_cost_includes: string | null;
  package_cost_excludes: string | null;
  package_extra_faqs: string | null;
  package_price: number;
  package_duration: number;
  package_duration_type: string;
  package_destination: number;
  package_grade: number | null;
  package_style: number | null;
  package_transportation: number | null;
  package_meals: number | null;
  package_accommodation: number | null;
  package_discount: number | null;
  package_group_size: string | null;
  package_max_altitude: string | null;
  package_departure_note: string | null;
  package_useful_info: string | null;
  package_trip_info: string | null;
  package_geo_longitude: string | null;
  package_geo_latitude: string | null;
  additional_field_1: string | null;
  additional_field_2: string | null;
  status: number;
  is_featured: number;
}

export async function importPackages(): Promise<void> {
  const packages = await queryAll<PackageRow>('SELECT * FROM travel_packages');
  for (const row of packages) {
    const destinationId = idMap.get('category', row.package_destination);
    if (!destinationId) {
      console.warn(`  travel_packages#${row.id}: unknown destination category ${row.package_destination}, skipped`);
      continue;
    }
    const created = await prisma.package.create({
      data: {
        title: row.package_title,
        abstract: nullIfEmpty(row.package_abstract),
        details: nullIfEmpty(row.package_details),
        tripInfoText: nullIfEmpty(row.package_trip_info),
        highlights: nullIfEmpty(row.package_highlights),
        costIncludesText: nullIfEmpty(row.package_cost_includes),
        costExcludesText: nullIfEmpty(row.package_cost_excludes),
        extraFaqs: toJsonOrWrap(row.package_extra_faqs) as never,
        price: row.package_price,
        duration: row.package_duration,
        durationType: row.package_duration_type,
        groupSize: nullIfEmpty(row.package_group_size),
        discount: row.package_discount || null,
        maxAltitude: nullIfEmpty(row.package_max_altitude),
        geoLongitude: nullIfEmpty(row.package_geo_longitude),
        geoLatitude: nullIfEmpty(row.package_geo_latitude),
        usefulInfo: nullIfEmpty(row.package_useful_info),
        departureNote: nullIfEmpty(row.package_departure_note),
        additionalField1: nullIfEmpty(row.additional_field_1),
        additionalField2: nullIfEmpty(row.additional_field_2),
        isFeatured: bool(row.is_featured),
        isActive: bool(row.status, true),
        destinationId,
        gradeId: row.package_grade ? idMap.get('category', row.package_grade) ?? null : null,
        styleId: row.package_style ? idMap.get('category', row.package_style) ?? null : null,
        transportationId: row.package_transportation
          ? idMap.get('category', row.package_transportation) ?? null
          : null,
        mealsId: row.package_meals ? idMap.get('category', row.package_meals) ?? null : null,
        accommodationId: row.package_accommodation
          ? idMap.get('category', row.package_accommodation) ?? null
          : null,
      },
    });
    idMap.set('package', row.id, created.id);
  }
  report.record('travel_packages', packages.length, (await prisma.package.count()));

  // --- Package children ---
  await importTiers();
  await importPriceGroups();
  await importFacts();
  await importAddOns();
  await importDepartures();
  await importItineraries();
  await importPackageMaps();

  // --- Package junctions (need Package to already exist) ---
  await importPackageCategoryLinks();
  await importPackageTripInfoLinks();
  await importPackageTestimonialLinks();
  await importCustomRelatedLinks();

  report.skip('travel_package_cost_details', 0, 'no legacy rows (columns unconfirmed, table empty in dump)');
  report.skip('travel_package_place', 0, 'no legacy rows');
  report.skip('travel_package_packagefaq', 0, 'no legacy rows');
  report.skip('travel_package_packagegroupfaq', 0, 'no legacy rows');
  report.skip('travel_package_faqcategory', 0, 'no legacy rows');
}

async function importTiers(): Promise<void> {
  interface Row {
    id: number;
    package_id: number;
    package_tier: string;
    package_tier_alias: string | null;
    package_tier_description: string | null;
    package_cost_includes: string | null;
    package_cost_excludes: string | null;
    wetravel_uuid: string | null;
  }
  const rows = await queryAll<Row>('SELECT * FROM travel_package_tiers');
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    if (!packageId) {
      console.warn(`  travel_package_tiers#${row.id}: dangling package_id ${row.package_id} (not in travel_packages), skipped`);
      continue;
    }
    await prisma.packageTier.create({
      data: {
        packageId,
        packageTier: row.package_tier,
        packageTierAlias: row.package_tier_alias ?? row.package_tier,
        packageTierDescription: row.package_tier_description ?? '',
        costIncludes: nullIfEmpty(row.package_cost_includes),
        costExcludes: nullIfEmpty(row.package_cost_excludes),
        wetravelUuid: nullIfEmpty(row.wetravel_uuid),
      },
    });
    count++;
  }
  report.record('travel_package_tiers', rows.length, count);
}

async function importPriceGroups(): Promise<void> {
  interface Row {
    id: number;
    package_id: number;
    package_tier: string;
    min_people: number;
    max_people: number;
    short_description: string | null;
    unit_price: number;
    offer_unit_price: number;
    offer_label: string | null;
    offer_information: string | null;
    is_default: number;
  }
  const rows = await queryAll<Row>('SELECT * FROM travel_package_pricegroups');
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    if (!packageId) {
      console.warn(`  travel_package_pricegroups#${row.id}: dangling package_id ${row.package_id} (not in travel_packages), skipped`);
      continue;
    }
    await prisma.priceGroup.create({
      data: {
        packageId,
        packageTier: row.package_tier,
        minPeople: row.min_people,
        maxPeople: row.max_people,
        shortDescription: nullIfEmpty(row.short_description),
        unitPrice: row.unit_price,
        // legacy defaults offer_unit_price to 0 when there's no offer — treat
        // 0 as "no offer" rather than a real zero-cost offer.
        offerUnitPrice: row.offer_unit_price ? row.offer_unit_price : null,
        offerLabel: nullIfEmpty(row.offer_label),
        offerInformation: nullIfEmpty(row.offer_information),
        isDefault: bool(row.is_default),
      },
    });
    count++;
  }
  report.record('travel_package_pricegroups', rows.length, count);
}

async function importFacts(): Promise<void> {
  interface Row {
    id: number;
    package_id: number;
    fact_title: string;
    fact_value: string;
  }
  const rows = await queryAll<Row>('SELECT * FROM travel_package_facts');
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    if (!packageId) {
      console.warn(`  travel_package_facts#${row.id}: dangling package_id ${row.package_id} (not in travel_packages), skipped`);
      continue;
    }
    await prisma.packageFact.create({
      data: { packageId, factTitle: row.fact_title, factValue: row.fact_value },
    });
    count++;
  }
  report.record('travel_package_facts', rows.length, count);
}

async function importAddOns(): Promise<void> {
  interface Row {
    id: number;
    package_id: number;
    addon_title: string;
    addon_description: string | null;
    addon_price: number;
    addon_unit: string | null;
  }
  const rows = await queryAll<Row>('SELECT * FROM travel_package_addons');
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    if (!packageId) {
      console.warn(`  travel_package_addons#${row.id}: dangling package_id ${row.package_id} (not in travel_packages), skipped`);
      continue;
    }
    await prisma.addOn.create({
      data: {
        packageId,
        addonTitle: row.addon_title,
        addonDescription: nullIfEmpty(row.addon_description),
        addonPrice: row.addon_price,
        addonUnit: nullIfEmpty(row.addon_unit),
      },
    });
    count++;
  }
  report.record('travel_package_addons', rows.length, count);
}

async function importDepartures(): Promise<void> {
  interface Row {
    id: number;
    package_id: number;
    departure_date: Date;
    departure_cost: number;
    departure_note: string | null;
    departure_status: string;
  }
  const rows = await queryAll<Row>('SELECT * FROM travel_package_departures');
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    if (!packageId) {
      console.warn(`  travel_package_departures#${row.id}: dangling package_id ${row.package_id} (not in travel_packages), skipped`);
      continue;
    }
    await prisma.departure.create({
      data: {
        packageId,
        departureDate: row.departure_date,
        departureCost: row.departure_cost,
        departureNote: nullIfEmpty(row.departure_note),
        departureStatus: row.departure_status,
      },
    });
    count++;
  }
  report.record('travel_package_departures', rows.length, count);
}

async function importItineraries(): Promise<void> {
  interface ItineraryRow {
    id: number;
    package_id: number;
    itinerary_title: string;
    itinerary_details: string | null;
    map_data: string | null;
  }
  const itineraries = await queryAll<ItineraryRow>('SELECT * FROM travel_package_itinerary');
  let itineraryCount = 0;
  for (const row of itineraries) {
    const packageId = idMap.get('package', row.package_id);
    if (!packageId) continue;
    const created = await prisma.itinerary.create({
      data: {
        title: row.itinerary_title,
        packageId,
        detailsText: nullIfEmpty(row.itinerary_details),
        mapData: nullIfEmpty(row.map_data),
      },
    });
    idMap.set('itinerary', row.id, created.id);
    itineraryCount++;
  }
  report.record('travel_package_itinerary', itineraries.length, itineraryCount);

  interface DetailRow {
    id: number;
    itinerary_id: number;
    itinerary_day: string;
    itinerary_title: string | null;
    itinerary_short_description: string | null;
    itinerary_description: string | null;
    itinerary_stop: number;
    origin: string | null;
    origin_coordinate: string | null;
    origin_elevation: string | null;
    destination: string | null;
    destination_coordinate: string | null;
    destination_elevation: string | null;
    travel_mode: string | null;
    distance: string | null;
    duration: string | null;
    encoded_polyline: string | null;
    meals: string | null;
    accommodation: string | null;
    itinerary_footnote: string | null;
    itinerary_status: number;
  }
  // Ordered by id so sortOrder reflects legacy insertion/day order (legacy has
  // no explicit order column — itinerary_day is free text and can't sort
  // itself, e.g. "Day 10" < "Day 2" lexically).
  const details = await queryAll<DetailRow>(
    'SELECT * FROM travel_package_itinerary_details ORDER BY itinerary_id, id',
  );
  let detailCount = 0;
  let sortOrder = 0;
  let lastItineraryId: number | null = null;
  for (const row of details) {
    const itineraryId = idMap.get('itinerary', row.itinerary_id);
    if (!itineraryId) continue;
    if (row.itinerary_id !== lastItineraryId) {
      sortOrder = 0;
      lastItineraryId = row.itinerary_id;
    }
    const created = await prisma.itineraryDetail.create({
      data: {
        itineraryId,
        sortOrder: sortOrder++,
        itineraryDay: row.itinerary_day,
        itineraryTitle: nullIfEmpty(row.itinerary_title),
        itineraryShortDescription: nullIfEmpty(row.itinerary_short_description),
        itineraryDescription: nullIfEmpty(row.itinerary_description),
        itineraryStop: row.itinerary_stop ?? null,
        accommodation: nullIfEmpty(row.accommodation),
        meals: nullIfEmpty(row.meals),
        origin: nullIfEmpty(row.origin),
        originCoordinate: nullIfEmpty(row.origin_coordinate),
        originElevation: nullIfEmpty(row.origin_elevation),
        destination: nullIfEmpty(row.destination),
        destinationCoordinate: nullIfEmpty(row.destination_coordinate),
        destinationElevation: nullIfEmpty(row.destination_elevation),
        travelMode: nullIfEmpty(row.travel_mode),
        distance: nullIfEmpty(row.distance),
        duration: nullIfEmpty(row.duration),
        encodedPolyline: nullIfEmpty(row.encoded_polyline),
        footnote: nullIfEmpty(row.itinerary_footnote),
        isActive: bool(row.itinerary_status, true),
      },
    });
    idMap.set('itinerary-detail', row.id, created.id);
    detailCount++;
  }
  report.record('travel_package_itinerary_details', details.length, detailCount);

  interface FactRow {
    id: number;
    itinerary_detail_id: number;
    fact_title: string;
    fact_value: string;
  }
  const facts = await queryAll<FactRow>('SELECT * FROM travel_package_itinerary_facts');
  let factCount = 0;
  for (const row of facts) {
    const detailId = idMap.get('itinerary-detail', row.itinerary_detail_id);
    if (!detailId) continue;
    await prisma.itineraryFact.create({
      data: { detailId, factTitle: row.fact_title, factValue: row.fact_value },
    });
    factCount++;
  }
  report.record('travel_package_itinerary_facts', facts.length, factCount);
}

async function importPackageMaps(): Promise<void> {
  interface Row {
    id: number;
    package_id: number | null;
    map_title: string;
    map_abstract: string | null;
    map_details: string | null;
    status: number | null;
  }
  const rows = await queryAll<Row>('SELECT * FROM travel_package_maps');
  let count = 0;
  for (const row of rows) {
    const packageId = row.package_id ? idMap.get('package', row.package_id) : undefined;
    if (!packageId) {
      console.warn(`  travel_package_maps#${row.id}: unresolved package_id ${row.package_id}, skipped`);
      continue;
    }
    const created = await prisma.packageMap.create({
      data: {
        packageId,
        mapTitle: row.map_title,
        mapAbstract: nullIfEmpty(row.map_abstract),
        mapDetails: nullIfEmpty(row.map_details),
        isActive: bool(row.status, true),
      },
    });
    idMap.set('package-map', row.id, created.id);
    count++;
  }
  report.record('travel_package_maps', rows.length, count);
}

async function importPackageCategoryLinks(): Promise<void> {
  // category_type_id on this junction is a stale default (see 02-content.ts
  // note on the equivalent blog junction) — resolved via category_id only.
  const rows = await queryAll<{ package_id: number; category_id: number }>(
    'SELECT package_id, category_id FROM travel_package_category',
  );
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    const categoryId = idMap.get('category', row.category_id);
    if (!packageId || !categoryId) continue;
    await prisma.package.update({
      where: { id: packageId },
      data: { categories: { connect: [{ id: categoryId }] } },
    });
    count++;
  }
  report.record('travel_package_category', rows.length, count);
}

async function importPackageTripInfoLinks(): Promise<void> {
  const rows = await queryAll<{ package_id: number; tripinfo_id: number }>(
    'SELECT package_id, tripinfo_id FROM travel_package_tripinfo',
  );
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    const tripInfoId = idMap.get('trip-info', row.tripinfo_id);
    if (!packageId || !tripInfoId) continue;
    await prisma.package.update({
      where: { id: packageId },
      data: { tripInfos: { connect: [{ id: tripInfoId }] } },
    });
    count++;
  }
  report.record('travel_package_tripinfo', rows.length, count);
}

// This table was previously assumed empty ("no legacy rows" — see git
// blame) and skipped entirely. It isn't: the real dump has one row per
// real testimonial (34/34), each tagging which package that review was
// for. Skipping it silently broke the public `/reviews` page's "By
// Package" filter — with every Testimonial.packages relation empty, the
// filter's own option list (built from whatever's actually loaded, see
// TestimonialsPageSection.tsx) had nothing but "Select a package" to
// show, and the per-package "Trip Reviews" section
// (app/[slug]/_components/ReviewsSection.tsx) had no reviews to render
// on any package page either. Same connect-by-idMap shape as
// importPackageTripInfoLinks above, just onto `testimonials` instead of
// `tripInfos`.
async function importPackageTestimonialLinks(): Promise<void> {
  const rows = await queryAll<{ package_id: number; testimonial_id: number }>(
    'SELECT package_id, testimonial_id FROM travel_package_testimonial',
  );
  let count = 0;
  for (const row of rows) {
    const packageId = idMap.get('package', row.package_id);
    const testimonialId = idMap.get('testimonial', row.testimonial_id);
    if (!packageId || !testimonialId) continue;
    await prisma.package.update({
      where: { id: packageId },
      data: { testimonials: { connect: [{ id: testimonialId }] } },
    });
    count++;
  }
  report.record('travel_package_testimonial', rows.length, count);
}

async function importCustomRelatedLinks(): Promise<void> {
  const rows = await queryAll<{ main_package_id: number; related_package_id: number }>(
    'SELECT main_package_id, related_package_id FROM travel_package_custom_related',
  );
  let count = 0;
  for (const row of rows) {
    const mainId = idMap.get('package', row.main_package_id);
    const relatedId = idMap.get('package', row.related_package_id);
    if (!mainId || !relatedId) continue;
    await prisma.package.update({
      where: { id: mainId },
      data: { customRelated: { connect: [{ id: relatedId }] } },
    });
    count++;
  }
  report.record('travel_package_custom_related', rows.length, count);
}
