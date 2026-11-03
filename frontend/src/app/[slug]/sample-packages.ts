import { TRIP_CATEGORIES } from "@/config/trip-categories";
import { ALL_SAMPLE_TRIPS } from "@/lib/sample-trips";
import type { PackageDetail } from "./data";
import { buildFaqCategories, buildItineraryDays, buildOverviewHtml, profileFor, ROUTES, routeKeyFor } from "./sample-package-content";

/**
 * Builds a full `PackageDetail` from a sample trip card so its page renders
 * while the database has no real packages. The copy is placeholder text,
 * identical in shape to what the real detail response maps to — every section
 * (facts, overview, route map, itinerary, departures, equipment, FAQs, reviews)
 * is filled. Looked up by `resolveContentBySlug` only when `SHOW_SAMPLE_DATA` is on.
 */
const GALLERY = ["/images/journey/trek.jpg", "/images/journey/climb.jpg", "/images/trips/featured-annapurna-trek.jpg"];

/** Placeholder packing list, in the shape the admin's rich-text editor produces. */
const PACKING_LIST_HTML = [
  "<p><strong>One of the hardest things is packing for a trek in Nepal's Himalayas. You have to know what to take with you on the trip and what to leave behind. Under- or overpacking is a dreadful idea.</strong></p>",
  "<p>We assign a porter for every 2 trekkers. Each porter carries about 20 kilograms (10 kg per person), and domestic flights have their own weight limit, so pack light and keep your main luggage to about 10 kg.</p>",
  "<h3>Basic Essential</h3>",
  listHtml([
    "Trekking boots: carry sturdy, well broken-in boots.",
    "Daypack (30-45L) with rain cover: for your daily necessities.",
    "Duffle bag (60-70L): carried by a porter, keep it to about 10 kg.",
    "Sleeping bag: one rated at least -15 is advised in winter.",
  ]),
  "<h3>Trekking Equipment</h3>",
  listHtml(["Trekking poles", "Gaiters for the rainy and winter season", "Torchlight or headlamp with spare batteries", "Refillable water bottle"]),
  "<h3>Clothing</h3>",
  "<h4>Upper part of the body (head, face and neck)</h4>",
  listHtml(["Sunglasses", "Scarf or face mask", "Sunscreen (SPF 50+)", "Sun hat or cap", "Woolen hat"]),
  "<h4>Middle part of the body (chest, stomach and hands)</h4>",
  listHtml(["Trekking shirts", "Thermal wear", "Fleece jacket", "Gloves", "Windproof jacket", "Raincoat and rain trousers", "Down jacket"]),
  "<h4>Lower part of the body (thighs, legs and feet)</h4>",
  listHtml(["Trekking trousers (quick-dry, water-resistant)", "Fleece trousers or woolen pants", "Socks and undergarments", "Sandals or crocs"]),
  "<h3>Other optional items</h3>",
  listHtml(["Spare batteries for the camera", "Playing cards and reading books"]),
  "<h3>Documents</h3>",
  listHtml(["A passport with a few copies", "2 passport-size photos", "Money for the trip (US dollars or euros)", "Personal medicine and a doctor's prescription, if needed", "Travel insurance", "Emergency contact details"]),
  "<p><strong>We provide:</strong> duffel bags, sleeping bags and down jackets upon request. This gear is to be returned to us after you finish your trek.</p>",
  "<p><strong>Tips:</strong> if you do not have the items listed above, you can also buy them in Kathmandu.</p>",
].join("");

const KNOW_BEFORE_YOU_GO: { heading: string; body: string }[] = [
  {
    heading: "Altitude and acclimatization",
    body: "<p>Our itineraries include rest days so your body can adjust to the altitude. Walk slowly, drink plenty of water and tell your guide straight away if you feel unwell.</p>",
  },
  {
    heading: "Permits and entry",
    body: "<p>We arrange all trekking permits. Please bring your passport and two passport-size photos, and arrive in Kathmandu at least one day before the trip starts.</p>",
  },
  {
    heading: "Accommodation and food",
    body: "<p>You stay in hotels in the city and in simple local teahouses on the trail. Meals are freshly cooked from a menu of local and international dishes.</p>",
  },
  {
    heading: "Travel insurance",
    body: "<p>Travel insurance that covers emergency evacuation at altitude is required for all trekkers.</p>",
  },
];

function listHtml(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

/** The end date of a trip starting on `start` that lasts `days` days (both "YYYY-MM-DD", UTC). */
function endDate(start: string, days: number): string {
  const date = new Date(`${start}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Math.max(days - 1, 0));
  return date.toISOString().slice(0, 10);
}

const DEPARTURE_STARTS = ["2026-11-09", "2026-11-13", "2026-11-17", "2026-11-21", "2026-11-25", "2026-11-29", "2026-12-05", "2026-12-15", "2027-01-10", "2027-02-14"];

export function getSamplePackageDetail(slug: string): PackageDetail | null {
  const card = ALL_SAMPLE_TRIPS.find((trip) => trip.slug === slug);
  if (!card) return null;

  const hoursTrip = (card.durationType ?? "").toLowerCase().startsWith("hour");
  const days = hoursTrip ? 1 : Number(card.duration) || 10;
  const price = card.priceFrom ?? 1000;
  const image = card.imageUrl ?? GALLERY[0];

  const route = ROUTES[routeKeyFor(slug)];
  const profile = profileFor(slug, card.countries, card.categories ?? []);
  const itineraryDays = buildItineraryDays(card.title, days, route, profile.mode);
  const maxAltitude = Math.max(...route.map((wp) => wp.alt));
  const categoryLabel = TRIP_CATEGORIES.find((category) => category.key === card.categories?.[0])?.label ?? "Trips";
  const startEnd = route[0].place;

  return {
    id: card.id,
    slug: card.slug,
    title: card.title,
    region: profile.country,
    breadcrumb: ["Home", "Destinations", card.countries[0] ?? "Nepal", categoryLabel, card.title],
    heroImages: [image, ...GALLERY.filter((src) => src !== image)].slice(0, 3),
    rating: card.rating ?? 5,
    reviewCount: card.reviewCount ?? 0,
    quickFacts: [
      { label: "Destination", value: profile.country },
      { label: "Duration", value: hoursTrip ? `${card.duration} Hours` : `${days} Day${days === 1 ? "" : "s"}` },
      { label: "Difficulty", value: profile.difficulty },
      { label: "Activity", value: profile.activity },
      { label: "Max Altitude", value: `${maxAltitude.toLocaleString()} M` },
      { label: "Group Size", value: "1-12" },
      { label: "Accommodation", value: profile.accommodation },
      { label: "Meals", value: "Breakfast, lunch and dinner" },
      { label: "Transport", value: profile.transport },
      { label: "Start & End Point", value: startEnd },
      { label: "Best Seasons", value: profile.bestSeasons },
      { label: "Walking Hours per Day", value: profile.hoursPerDay },
    ],
    priceFrom: price,
    intro: `The ${card.title} is a ${days}-day guided journey from ${route[0].place} to ${route[route.length - 1].place}, led by experienced local guides, with comfortable stays and well-paced days.`,
    highlights: [
      `Reach ${route[route.length - 1].place} at ${route[route.length - 1].alt.toLocaleString()} m`,
      "Experienced, government-licensed guides and a friendly local crew",
      "Authentic local culture, villages and traditions along the way",
      "Carefully planned days with time to rest and take photographs",
      "Small groups with a flexible, safe itinerary",
    ],
    overview: buildOverviewHtml(card.title, days, route, profile),
    shortItinerary: itineraryDays.map(({ day, title, altitudeM, durationHours }) => ({ day, title, altitudeM, durationHours })),
    detailedItineraryIntro: `<p><strong>Find the detailed day-to-day itinerary for the ${card.title} - ${days} Days.</strong> The program includes arrival and departure days to and from ${profile.country.split(",")[0]}.</p>`,
    detailedItinerary: [{ title: card.title, image, days: itineraryDays }],
    includes: [
      { category: "Transport", icon: null, html: listHtml(["Airport pick-up and drop-off by private vehicle", "All transport listed in the itinerary"]), items: ["Airport pick-up and drop-off by private vehicle", "All transport listed in the itinerary"] },
      { category: "Accommodation", icon: null, html: listHtml(["Hotels in the cities", `${profile.mode === "trek" ? "Teahouse and guest house" : "Lodge"} accommodation on twin-share basis`]), items: ["Hotels in the cities", "Accommodation on twin-share basis"] },
      { category: "Meals", icon: null, html: listHtml(["Breakfast, lunch and dinner as listed", "Tea, coffee and boiled water during the trip"]), items: ["Breakfast, lunch and dinner as listed", "Tea, coffee and boiled water during the trip"] },
      { category: "Guide and permits", icon: null, html: listHtml(["Experienced, licensed English-speaking guide", "All required permits and entry fees", "Government taxes and service charges"]), items: ["Experienced, licensed English-speaking guide", "All required permits and entry fees", "Government taxes and service charges"] },
    ],
    excludes: [
      { category: "Not included", icon: null, html: listHtml(["International flights", "Travel insurance", "Visa fees", "Personal expenses, drinks and tips", "Anything not mentioned in the included section"]), items: ["International flights", "Travel insurance", "Visa fees", "Personal expenses, drinks and tips", "Anything not mentioned in the included section"] },
    ],
    costTiers: [
      { groupSize: "1 pax", pricePerPerson: Math.round(price * 1.15) },
      { groupSize: "2 - 4 pax", pricePerPerson: Math.round(price * 1.08) },
      { groupSize: "5 - 12 pax", pricePerPerson: price },
    ],
    addOns: [
      { label: "Single room supplement", price: 180, unit: "per trip", chargeBy: "FLAT", peoplePerRoom: 1 },
      { label: "Private departure", price: 250, unit: "per person", chargeBy: "PERSON", peoplePerRoom: 1 },
    ],
    departures: DEPARTURE_STARTS.map((start) => ({ startDate: start, endDate: endDate(start, days), status: "Available" as const, price })),
    altitudeProfile: itineraryDays.map((day) => ({ day: day.day, altitudeM: day.altitudeM, label: day.locations[0]?.label ?? day.title })),
    temperatureProfile: itineraryDays.map((day) => ({ day: day.day, maxC: Math.round(26 - day.altitudeM / 400), minC: Math.round(14 - day.altitudeM / 380) })),
    routePath: route.map((point): [number, number] => [point.lat, point.lng]),
    packingListIntro: PACKING_LIST_HTML,
    knowBeforeYouGo: KNOW_BEFORE_YOU_GO,
    faqCategories: buildFaqCategories(card.title, days, profile),
    reviewBreakdown: [
      { stars: 5, percent: 100 },
      { stars: 4, percent: 0 },
      { stars: 3, percent: 0 },
      { stars: 2, percent: 0 },
      { stars: 1, percent: 0 },
    ],
    reviews: [
      { title: "Amazing experience", body: "Great guides, great views and very well organised from start to finish.", name: "Katie Marquis", date: "May 13, 2026", rating: 5 },
      { title: "A life changing trip", body: "Absolutely awesome, the most memorable trip I've done. Went with a great supportive group with excellent guides. Do some research to prepare, and take the rest days seriously.", name: "David Hart", date: "Jul 01, 2026", rating: 5 },
      { title: "Highly recommend this company", body: "Very friendly and knowledgeable guides did everything to make sure everyone had a pleasant trip. The whole crew was amazing — they were all part of a great team.", name: "Gina Foster", date: "May 02, 2026", rating: 5 },
      { title: "Magical memories", body: "Incredible experience from the first email to the last day. Everything was seamless and the views were beyond anything we imagined.", name: "Mark Reynolds", date: "Apr 12, 2026", rating: 5 },
    ],
    stories: [],
    similarPackages: ALL_SAMPLE_TRIPS.filter((trip) => trip.slug !== slug)
      .slice(0, 3)
      .map((trip) => ({
        image: trip.imageUrl ?? GALLERY[0],
        title: trip.title,
        duration: `${trip.duration} ${trip.durationType}`,
        rating: String(trip.rating ?? 5),
        priceFrom: `US$${trip.priceFrom}`,
        slug: trip.slug,
      })),
  };
}
