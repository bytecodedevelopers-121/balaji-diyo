import type { ItineraryDay } from "./data";

/**
 * Building blocks for the sample package pages (`sample-packages.ts`): route
 * waypoints with altitudes per destination, a day-by-day itinerary generated
 * from them, and the overview copy — all placeholder text, shaped like the
 * real package content so every section renders fully.
 */
export type Waypoint = { place: string; lat: number; lng: number; alt: number };

const KATHMANDU: Waypoint = { place: "Kathmandu", lat: 27.7172, lng: 85.324, alt: 1350 };

/** Approximate waypoints per destination, so the route map and altitude chart have real data. */
export const ROUTES: Record<string, Waypoint[]> = {
  everest: [
    KATHMANDU,
    { place: "Lukla", lat: 27.6869, lng: 86.7314, alt: 2860 },
    { place: "Phakding", lat: 27.7452, lng: 86.7127, alt: 2610 },
    { place: "Namche Bazaar", lat: 27.8069, lng: 86.714, alt: 3440 },
    { place: "Tengboche", lat: 27.8362, lng: 86.7644, alt: 3867 },
    { place: "Dingboche", lat: 27.8914, lng: 86.8311, alt: 4410 },
    { place: "Lobuche", lat: 27.9471, lng: 86.8105, alt: 4940 },
    { place: "Everest Base Camp", lat: 28.0026, lng: 86.8528, alt: 5364 },
  ],
  annapurna: [
    { place: "Pokhara", lat: 28.2096, lng: 83.9856, alt: 820 },
    { place: "Nayapul", lat: 28.25, lng: 83.7167, alt: 1070 },
    { place: "Ghandruk", lat: 28.3777, lng: 83.8112, alt: 1940 },
    { place: "Chhomrong", lat: 28.377, lng: 83.82, alt: 2170 },
    { place: "Himalaya Hotel", lat: 28.46, lng: 83.88, alt: 2920 },
    { place: "Machapuchare Base Camp", lat: 28.49, lng: 83.9, alt: 3700 },
    { place: "Annapurna Base Camp", lat: 28.53, lng: 83.878, alt: 4130 },
  ],
  langtang: [
    KATHMANDU,
    { place: "Syabrubesi", lat: 28.164, lng: 85.35, alt: 1550 },
    { place: "Lama Hotel", lat: 28.198, lng: 85.495, alt: 2480 },
    { place: "Langtang Village", lat: 28.213, lng: 85.515, alt: 3430 },
    { place: "Kyanjin Gompa", lat: 28.211, lng: 85.568, alt: 3870 },
  ],
  manaslu: [
    KATHMANDU,
    { place: "Machha Khola", lat: 28.304, lng: 84.869, alt: 930 },
    { place: "Jagat", lat: 28.351, lng: 84.898, alt: 1340 },
    { place: "Deng", lat: 28.513, lng: 84.832, alt: 1860 },
    { place: "Samagaon", lat: 28.588, lng: 84.833, alt: 3530 },
    { place: "Samdo", lat: 28.648, lng: 84.84, alt: 3860 },
    { place: "Bimthang", lat: 28.604, lng: 84.669, alt: 3590 },
    { place: "Dharapani", lat: 28.51, lng: 84.356, alt: 1960 },
  ],
  kailash: [
    KATHMANDU,
    { place: "Kyirong", lat: 28.17, lng: 85.41, alt: 2700 },
    { place: "Saga", lat: 29.33, lng: 85.23, alt: 4640 },
    { place: "Paryang", lat: 29.98, lng: 83.37, alt: 4750 },
    { place: "Lake Manasarovar", lat: 30.68, lng: 81.5, alt: 4590 },
    { place: "Darchen", lat: 30.97, lng: 81.3, alt: 4670 },
    { place: "Dirapuk", lat: 31.08, lng: 81.28, alt: 5000 },
    { place: "Drolma La Pass", lat: 31.05, lng: 81.33, alt: 5630 },
  ],
  tibet: [
    KATHMANDU,
    { place: "Lhasa", lat: 29.65, lng: 91.1, alt: 3650 },
    { place: "Gyantse", lat: 28.92, lng: 89.6, alt: 4040 },
    { place: "Shigatse", lat: 29.27, lng: 88.88, alt: 3840 },
  ],
  bhutan: [
    { place: "Paro", lat: 27.43, lng: 89.41, alt: 2280 },
    { place: "Thimphu", lat: 27.47, lng: 89.64, alt: 2320 },
    { place: "Punakha", lat: 27.59, lng: 89.86, alt: 1250 },
    { place: "Tiger's Nest Monastery", lat: 27.49, lng: 89.36, alt: 3120 },
  ],
  multi: [
    KATHMANDU,
    { place: "Lhasa", lat: 29.65, lng: 91.1, alt: 3650 },
    { place: "Paro", lat: 27.43, lng: 89.41, alt: 2280 },
    { place: "Thimphu", lat: 27.47, lng: 89.64, alt: 2320 },
    { place: "Punakha", lat: 27.59, lng: 89.86, alt: 1250 },
  ],
  nepal: [
    KATHMANDU,
    { place: "Bhaktapur", lat: 27.67, lng: 85.43, alt: 1400 },
    { place: "Pokhara", lat: 28.2096, lng: 83.9856, alt: 820 },
    { place: "Chitwan", lat: 27.58, lng: 84.5, alt: 150 },
    { place: "Lumbini", lat: 27.47, lng: 83.28, alt: 150 },
  ],
  wildlife: [
    KATHMANDU,
    { place: "Chitwan National Park", lat: 27.58, lng: 84.5, alt: 150 },
    { place: "Bardia National Park", lat: 28.38, lng: 81.5, alt: 150 },
  ],
};

/** Which route a sample package follows, from its slug. */
export function routeKeyFor(slug: string): string {
  if (slug.includes("kailash")) return "kailash";
  if (slug.includes("nepal-tibet-bhutan")) return "multi";
  if (slug.includes("lhasa") || slug.includes("tibet")) return "tibet";
  if (slug.includes("bhutan")) return "bhutan";
  if (slug.includes("annapurna") || slug.includes("ghorepani")) return "annapurna";
  if (slug.includes("langtang")) return "langtang";
  if (slug.includes("manaslu")) return "manaslu";
  if (slug.includes("chitwan") || slug.includes("safari") || slug.includes("bardia")) return "wildlife";
  if (/everest|ebc|cho-la|lobuche|mera|heli/.test(slug)) return "everest";
  return "nepal";
}

export interface TripProfile {
  mode: "trek" | "tour";
  country: string;
  activity: string;
  difficulty: string;
  accommodation: string;
  transport: string;
  bestSeasons: string;
  hoursPerDay: string;
}

/** Facts that depend on the kind of trip, not just its name. */
export function profileFor(slug: string, countries: string[], categories: string[]): TripProfile {
  const mode = /trek|climb|cho-la|ebc|ghorepani/.test(slug) ? "trek" : "tour";
  const country = countries.length > 1 ? countries.join(", ") : (countries[0] ?? "Nepal");
  const climbing = categories.includes("climbing");
  const safari = categories.includes("safari");
  return {
    mode,
    country: slug.includes("nepal-tibet-bhutan") ? "Nepal, Tibet and Bhutan" : country,
    activity: climbing ? "Peak Climbing" : mode === "trek" ? "Walking and Hiking" : safari ? "Wildlife Safari" : slug.includes("kailash") ? "Pilgrimage and Sightseeing" : "Sightseeing and Culture",
    difficulty: climbing ? "Challenging" : mode === "trek" ? "Moderate" : slug.includes("kailash") ? "Moderate to Challenging" : "Easy",
    accommodation: mode === "trek" ? "Hotel and teahouse" : "Hotel and lodge",
    transport: mode === "trek" ? "Flight and private vehicle" : "Private vehicle",
    bestSeasons: slug.includes("kailash") ? "May to September" : slug.includes("bhutan") ? "March to May and September to November" : "Autumn and Spring",
    hoursPerDay: mode === "trek" ? "5-7 hours" : "2-4 hours",
  };
}

/** One itinerary day per trip day (capped at 21), walking the route from first stop to last and back. */
export function buildItineraryDays(title: string, count: number, route: Waypoint[], mode: "trek" | "tour"): ItineraryDay[] {
  const total = Math.max(1, Math.min(count, 21));
  const last = route.length - 1;
  let previousStage = -1;

  return Array.from({ length: total }, (_, index): ItineraryDay => {
    const isFirst = index === 0;
    const isLast = index === total - 1 && total > 1;
    const stage = isLast ? 0 : total === 1 ? 0 : Math.round((index * last) / Math.max(total - 2, 1));
    const wp = route[Math.min(stage, last)];
    const same = stage === previousStage && !isFirst;
    previousStage = stage;

    let dayTitle: string;
    let description: string;
    if (total === 1) {
      dayTitle = `Full-day guided ${mode === "trek" ? "outing" : "tour"} from ${wp.place}`;
      description = `Your guide meets you at the hotel in ${wp.place} for a relaxed full day of sightseeing, with lunch included and time for photographs.`;
    } else if (isFirst) {
      dayTitle = `Arrival in ${wp.place} and transfer to the hotel`;
      description = `Welcome to ${wp.place}! Our representative greets you at the airport and transfers you to your hotel. After check-in you can relax or stroll around town; in the evening you join a briefing with your guide about the ${title} and the days ahead.`;
    } else if (isLast) {
      dayTitle = `Final departure from ${wp.place}`;
      description = `After breakfast and a last look around, our team transfers you to the airport for your onward flight. Thank you for travelling with us — we hope to welcome you back soon.`;
    } else if (same) {
      dayTitle = mode === "trek" ? `Rest and acclimatization day in ${wp.place}` : `Explore ${wp.place} at leisure`;
      description = `A flexible day in ${wp.place}: ${mode === "trek" ? "a short acclimatization hike with your guide, then time to rest, wash and enjoy the views" : "optional visits to local monasteries, markets and viewpoints with your guide"}.`;
    } else {
      dayTitle = mode === "trek" ? `Trek to ${wp.place} (${wp.alt.toLocaleString()} m)` : `Travel to ${wp.place}`;
      description =
        mode === "trek"
          ? `Today you follow the trail towards ${wp.place}, passing villages, prayer-flag bridges and open mountain views. The pace is steady, with stops for tea and photographs along the way.`
          : `Today you travel to ${wp.place} by private vehicle, with stops at viewpoints and local sights on the way. Check in and enjoy the rest of the day at your own pace.`;
    }

    return {
      day: index + 1,
      title: dayTitle,
      altitudeM: wp.alt,
      durationHours: isFirst || isLast || total === 1 ? (total === 1 ? 7 : 0) : mode === "trek" ? 5 + (index % 3) : 3 + (index % 3),
      description,
      locations: [{ label: wp.place, href: null }],
      lat: wp.lat,
      lng: wp.lng,
      transport: isFirst || isLast || mode === "tour" ? "Private tourist vehicle" : undefined,
      meals: isFirst ? "Dinner" : isLast ? "Breakfast" : "Breakfast, Lunch and Dinner",
      accommodation: isLast ? undefined : `${mode === "trek" && !isFirst ? "Teahouse / guest house" : "Hotel"} in ${wp.place}`,
    };
  });
}

function listHtml(items: string[]) {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

/** The long "Overview" copy, in the same shape as a real package: intro, at a glance, why choose, highlights, stops, what to expect. */
export function buildOverviewHtml(title: string, days: number, route: Waypoint[], profile: TripProfile): string {
  const maxAlt = Math.max(...route.map((wp) => wp.alt));
  const places = route.map((wp) => wp.place);
  const lead = `The ${title} is one of ${profile.country.split(",")[0]}'s most rewarding journeys, taking you through ${places.slice(0, 3).join(", ")} and beyond.`;
  return [
    `<h3>Introduction - ${title} - ${days} Days</h3>`,
    `<p><strong>${lead}</strong> This ${days}-day journey is guided by experienced local leaders and combines landscapes, culture and comfortable, well-paced days.</p>`,
    `<p><strong>The journey combines scenery, local culture and carefully planned rest days.</strong> The highlight is reaching ${places[places.length - 1]} (${maxAlt.toLocaleString()} m), with time to take in the views, meet local people and enjoy the journey at your own pace.</p>`,
    `<h3>${title} – ${days} Days at a Glance</h3>`,
    listHtml([
      `Duration: ${days} days`,
      `Destination: ${profile.country}`,
      `Maximum altitude: ${maxAlt.toLocaleString()} m`,
      `Starting and ending point: ${places[0]}`,
      `Difficulty: ${profile.difficulty}`,
      `Accommodation: ${profile.accommodation}`,
      `Group size: 1–12`,
      `Best seasons: ${profile.bestSeasons}`,
    ]),
    `<h3>Why choose our ${days}-day ${title}?</h3>`,
    listHtml([
      "Experienced, government-licensed local guides",
      "Small groups of up to 12 travelers",
      "Carefully planned itinerary with rest days",
      "All required permits arranged",
      "Guaranteed departures and private departures available",
      "Responsible tourism that supports local communities",
    ]),
    `<h3>Highlights of ${title} – ${days} Days</h3>`,
    listHtml([
      `Reach ${places[places.length - 1]} at ${maxAlt.toLocaleString()} m`,
      `Pass through ${places.slice(1, Math.min(places.length - 1, 4)).join(", ") || places[0]} with a local guide`,
      "Experience authentic local culture and traditions",
      "Enjoy breathtaking mountain and valley scenery",
      "Stay in comfortable hotels and welcoming local lodges",
    ]),
    `<h3>${title}: Elevation and Stops</h3>`,
    listHtml(route.map((wp, index) => `${index === 0 ? "Starting Point: " : ""}${wp.place}: ${wp.alt.toLocaleString()} m`)),
    `<h3>What to Expect on the ${days}-Day ${title}</h3>`,
    `<p>Expect an unforgettable journey from ${places[0]} to ${places[places.length - 1]}, with experienced local guides and a well-designed itinerary. Daily distances are manageable, and you will have time to rest, take photographs and meet local people along the way.</p>`,
    `<h3>${title} – Route Map &amp; Itinerary</h3>`,
    listHtml([`You will follow the ${places.join(" → ")} route on this ${days}-day trip — find the route map and the daily plan in detail below.`]),
  ].join("");
}

/** FAQ groups for a sample trip, grouped like the real FAQ section. */
export function buildFaqCategories(title: string, days: number, profile: TripProfile) {
  return [
    {
      category: "General",
      questions: [
        { question: `Can I do the ${title} as a private trip?`, answer: "Yes. Private departures are available on any date of the year for solo travelers, couples, friends and families — an additional fee applies." },
        { question: `Where does the ${title} start?`, answer: "The trip starts and ends in Kathmandu. The trip date is your arrival date in the city." },
        { question: "How many hours do we travel or walk each day?", answer: `Expect about ${profile.hoursPerDay} on a typical day, with shorter days for arrival, rest and departure.` },
        { question: `What is included in the ${days}-day ${title}?`, answer: "Airport transfers, accommodation, meals as listed, an experienced guide, all permits and the transport in the itinerary are included." },
      ],
    },
    {
      category: "Best Time, Weather and Temperature",
      questions: [
        { question: `What is the best time for the ${title}?`, answer: `The best seasons are ${profile.bestSeasons.toLowerCase()}, when skies are clearest and conditions most comfortable.` },
      ],
    },
    {
      category: "Difficulty, Fitness and Preparation",
      questions: [
        { question: `How difficult is the ${title}?`, answer: `The trip is rated ${profile.difficulty.toLowerCase()}. No technical experience is needed, but a reasonable level of fitness helps.` },
        { question: `Can beginners do the ${title}?`, answer: "Yes. With some preparation and a steady pace, most healthy travelers complete it comfortably." },
        { question: "How fit do I need to be?", answer: "Regular walking, cycling or swimming for a few weeks beforehand is enough for most travelers." },
      ],
    },
    {
      category: "Accommodation, Food and Drinks",
      questions: [
        { question: "What food is available during the trip?", answer: "Freshly cooked breakfast, lunch and dinner with local and international dishes; vegetarian meals are always available." },
        { question: "What type of accommodation is available?", answer: `${profile.accommodation} — twin-share rooms, with single rooms available for an additional fee.` },
      ],
    },
  ];
}
