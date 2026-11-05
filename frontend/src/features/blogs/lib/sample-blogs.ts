import type { PaginationMeta } from "@/types/api.types";
import type { BlogCategoryOption, BlogPost } from "../types/blog.types";

/**
 * Built-in sample posts, shown only while the API has no blogs (see
 * `SHOW_SAMPLE_DATA` in lib/sample-data.ts). Photos are reused from existing assets.
 */
export const SAMPLE_BLOG_CATEGORIES: BlogCategoryOption[] = [
  { id: "sample-cat-everest", title: "Everest Region" },
  { id: "sample-cat-annapurna", title: "Annapurna Region" },
  { id: "sample-cat-guides", title: "Trekking Guides" },
  { id: "sample-cat-culture", title: "Culture and Wildlife" },
];

const CAT = Object.fromEntries(SAMPLE_BLOG_CATEGORIES.map((c) => [c.id, c])) as Record<string, BlogCategoryOption>;
const AUTHOR = [{ id: "sample-author", name: "Arjun" }];

function post(
  n: number,
  title: string,
  blogDate: string,
  category: string,
  imageUrl: string,
  paragraphs: string[],
  contentHtml?: string,
): BlogPost {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return {
    id: `sample-blog-${n}`,
    title,
    abstract: paragraphs[0] ?? null,
    content: contentHtml ?? paragraphs.map((text) => `<p>${text}</p>`).join(""),
    blogDate,
    slug,
    authors: AUTHOR,
    categories: [CAT[category]!],
    imageUrl,
    imageIsWideBanner: false,
  };
}

const MARCH_CONTENT = `<p><strong>The Ghorepani Poon Hill Trek in March combines the beginning of rhododendron season with warming days and opportunities for clear Himalayan views.</strong> Sunrise at 3,210 meters remains cold, and higher paths can still have snow or ice. Expect a rewarding spring trek with steep steps, changing weather, and flowering that varies with elevation.</p>
<h2>When Spring Returns to the Annapurna Foothills</h2>
<p>March brings small signs of change to the Annapurna foothills. The sunshine warms the stone terraces of hillside villages, and shaded forest paths can still carry the chill of winter. Rhododendron buds begin opening among the dark leaves on the climb toward Ghorepani.</p>
<p><strong>The mountains give this forest journey its destination.</strong> On a clear morning at Poon Hill, the first sunlight catches Dhaulagiri and Annapurna South while the valleys below remain in shadow.</p>
<h2>What Makes the Ghorepani Poon Hill Trek Special in March?</h2>
<ul>
<li><strong>Rhododendrons Bring Color to the Forest Climb:</strong> The woodland above Ulleri and around Ghorepani is a main attraction. As flowers open, clusters of red and pink brighten the evergreen canopy.</li>
<li><strong>Himalayan Sunrise Above Layers of Mountain Ridges:</strong> From Poon Hill at 3,210 meters, the panorama brings Dhaulagiri, Annapurna South, Hiunchuli and Machhapuchhre into view when weather is clear.</li>
<li><strong>Birdsong and Small Discoveries Beneath the Trees:</strong> Look beyond the blossoms: moss-covered trunks, streams and birds moving through the branches.</li>
</ul>
<h2>What Are the Weather and Temperatures Like in March?</h2>
<p><strong>March brings warmer walking conditions to the lower hills, but Ghorepani and Poon Hill can still feel wintry, so expect cold mornings.</strong></p>
<h3>How Warm Are the Days and How Cold Are the Nights?</h3>
<p>These approximate ranges illustrate the temperature differences along the route:</p>
<table>
<thead><tr><th>Location</th><th>Approximate elevation</th><th>Daytime temperature</th><th>Nighttime temperature</th></tr></thead>
<tbody>
<tr><td>Nayapul</td><td>1,070 m</td><td>22°C to 26°C</td><td>10°C to 14°C</td></tr>
<tr><td>Tikhedhunga</td><td>1,540 m</td><td>18°C to 22°C</td><td>8°C to 12°C</td></tr>
<tr><td>Ghorepani</td><td>2,860 m</td><td>10°C to 14°C</td><td>0°C to 4°C</td></tr>
<tr><td>Tadapani</td><td>2,630 m</td><td>12°C to 16°C</td><td>2°C to 6°C</td></tr>
</tbody>
</table>
<p><strong>These are estimates, not measured climate averages or forecasts.</strong> Actual conditions can fall outside these ranges.</p>
<h3>What Should You Expect Throughout the Day?</h3>
<ul>
<li><strong>Morning:</strong> Cold starts, especially higher up. Clear mornings offer good viewing opportunities, but clouds can obscure the mountains.</li>
<li><strong>Afternoon:</strong> Lower trails feel warmer, while cloud or haze may build and showers are possible.</li>
<li><strong>Night:</strong> Temperatures fall after sunset. Warm evening layers and suitable sleeping equipment remain important at the higher lodges.</li>
</ul>
<h2>How Difficult Is the Ghorepani Poon Hill Trek in March?</h2>
<p><strong>The Ghorepani Poon Hill Trek is moderate in March and suits beginners who can handle uphill and downhill walking.</strong> In typical conditions, the route requires no technical climbing.</p>
<h3>Which Sections Are the Most Challenging?</h3>
<ul>
<li><strong>Tikhedhunga to Ulleri:</strong> The long stone staircase is one of the toughest sustained climbs. Take short breaks and keep a comfortable pace.</li>
<li><strong>Ghorepani to Poon Hill:</strong> The sunrise climb starts in darkness and cold. A headlamp helps you see uneven steps.</li>
</ul>
<h2>What Should You Pack for the Poon Hill Trek in March?</h2>
<p>Pack for warm uphill walks, cold sunrise waits, and possible spring showers.</p>
<ul>
<li><strong>Layered clothing:</strong> Quick-drying walking clothes, a fleece, thermal layers and an insulated jacket.</li>
<li><strong>Rain and wind protection:</strong> A waterproof jacket, rain trousers and a backpack cover.</li>
<li><strong>Sunrise essentials:</strong> A headlamp with spare batteries, a warm hat and gloves.</li>
</ul>
<blockquote><p>Should you bring microspikes? Ask your guide about recent conditions before departure. They may help on icy sections, but they are not automatically necessary throughout March.</p></blockquote>
<h2>How Much Does the Poon Hill Trek Cost in March?</h2>
<p>The price depends mainly on your itinerary, group size, and included services.</p>
<table>
<thead><tr><th>Package</th><th>Price per person</th></tr></thead>
<tbody>
<tr><td>Three-day Poon Hill Trek from Pokhara</td><td>USD 275</td></tr>
<tr><td>Four-day Ghorepani Poon Hill Trek</td><td>USD 375</td></tr>
</tbody>
</table>
<h3>Which Permits Are Needed?</h3>
<p>For foreign visitors, the published fees are:</p>
<table>
<thead><tr><th>Permit</th><th>Non-SAARC nationals</th><th>SAARC nationals</th></tr></thead>
<tbody>
<tr><td>Annapurna Conservation Area Permit (ACAP)</td><td>NPR 3,000</td><td>NPR 1,000</td></tr>
<tr><td>Trekkers Information Management System (TIMS) card</td><td>NPR 2,000</td><td>NPR 1,000</td></tr>
</tbody>
</table>
<h2>FAQs about Ghorepani Poon Hill Trek in March</h2>
<h3>Is March or April Better for the Poon Hill Trek?</h3>
<p>March suits trekkers who enjoy cooler walking conditions and the gradual arrival of spring. April generally brings warmer weather and more widespread rhododendron flowering.</p>
<h3>Does Snow Ever Block the Poon Hill Trail in March?</h3>
<p>Snowfall can temporarily make upper sections difficult, while older ice may linger in shaded places. Your guide should assess recent conditions before the sunrise climb.</p>
<h2>Final Recommendation: Is March Right for Your Poon Hill Trek?</h2>
<p>March is a rewarding choice if you enjoy watching spring unfold: rhododendrons opening along forest paths, sunlight warming village terraces, and cold mornings beneath the Annapurna and Dhaulagiri ranges. Come prepared for changing weather, and let the woodland and village encounters be as much a part of the journey as the sunrise.</p>`;

const G = (n: number) => `/images/gallery/everest-${n}.jpg`;
const T = (n: number, name: string) => `/images/about-us/trail-${n}-${name}.jpg`;

/** Newest first. */
export const SAMPLE_BLOGS: BlogPost[] = [
  post(1, "Gokyo Lake Trek in December 2026", "2026-12-02", "sample-cat-everest", "/images/cta/gokyo-lake-yak.jpg", [
    "Gokyo Lake Trek in December is a peaceful winter journey through the Everest region, which leads from Lukla and Namche Bazaar to Gokyo village at approximately 4,790 meters. Trekkers can expect quiet trails, crisp mountain views and lakes that may be partly or fully frozen depending on the season.",
    "December days are often clear and nights become colder at higher elevations. With proper acclimatization, warm trekking gear and a flexible itinerary, this is one of the best times for sunrise views from Gokyo Ri.",
    "Pack a four-season sleeping bag, insulated boots and a good down jacket, and expect some lodges at the top of the valley to have limited menus.",
  ]),
  post(2, "Ghorepani Poon Hill Trek in April: Weather and Best Dates", "2026-10-21", "sample-cat-annapurna", T(1, "overlook"), [
    "April is one of the best months for the Ghorepani Poon Hill Trek. Rhododendron forests are in bloom, days are warm and the mountain views at sunrise are usually clear.",
    "Expect daytime temperatures of 15 to 20 degrees at the lower villages and near freezing at Ghorepani at night. The trail is busiest in the first three weeks of April, so book lodges early.",
  ]),
  post(3, "Ghorepani Poon Hill Trek in March", "2026-10-16", "sample-cat-annapurna", T(2, "path"), [
    "The Ghorepani Poon Hill Trek in March combines the beginning of rhododendron season with warming days and opportunities for clear Himalayan views. Sunrise at 3,210 meters remains cold, and higher paths can still have snow or ice.",
  ], MARCH_CONTENT),
  post(4, "Annapurna Circuit Trek Distance: KM, Miles and Route", "2026-10-04", "sample-cat-annapurna", G(3), [
    "The Annapurna Circuit covers about 160 to 230 kilometers depending on where you start and finish, and how much of the road you walk or drive.",
    "Most trekkers take 12 to 18 days, crossing the Thorong La Pass at 5,416 meters. The classic route runs from Besisahar to Muktinath and then down to Jomsom or Tatopani.",
  ]),
  post(5, "Annapurna Circuit Trek Cost: Price and Budget Guide", "2026-10-04", "sample-cat-guides", G(4), [
    "The cost of the Annapurna Circuit Trek depends on the length of the trip, the group size and whether you travel with a guide and porter. Permits, transport, lodges and food are the main expenses.",
    "A guided package includes permits, accommodation, meals, a licensed guide and transport. Independent trekkers should budget for lodge prices that rise with altitude.",
  ]),
  post(6, "Annapurna Circuit Trek Permits: Cost and Requirements", "2026-10-04", "sample-cat-guides", T(4, "bridge"), [
    "You need an Annapurna Conservation Area Permit and a local municipality entry permit for the Annapurna Circuit. Both are arranged in Kathmandu or Pokhara, or by your trekking agency.",
    "Carry your passport and passport-size photos. Permit fees change from time to time, so confirm the latest rates before you travel.",
  ]),
  post(7, "Annapurna Circuit Trek Packing List: What to Pack", "2026-10-04", "sample-cat-guides", G(5), [
    "Packing for the Annapurna Circuit means preparing for subtropical valleys and freezing passes. Layering is the key idea: base layers, a fleece, a down jacket and a waterproof shell.",
    "Do not forget sturdy boots, a sleeping bag rated to minus ten degrees, sun protection, a water bottle with purification tablets and a basic first-aid kit.",
  ]),
  post(8, "Everest Base Camp Trek in October: Weather and Crowds", "2026-09-18", "sample-cat-everest", G(1), [
    "October is the most popular month for the Everest Base Camp Trek. Skies are clear, the monsoon has ended and the mountain views are at their best.",
    "Expect busy trails and full lodges in Namche Bazaar and Lobuche. Book your flights to Lukla early and keep a spare day in case of delays.",
  ]),
  post(9, "Chitwan National Park Safari: What to Expect", "2026-09-05", "sample-cat-culture", T(5, "ridge"), [
    "Chitwan National Park in the Terai is home to one-horned rhinoceros, Bengal tigers, deer, crocodiles and hundreds of bird species.",
    "Jeep safaris, canoe rides and guided jungle walks are the main activities. The best season is October to March, when the grass is cut and animals are easier to spot.",
  ]),
  post(10, "Boudhanath Stupa: History and Visiting Tips", "2026-08-22", "sample-cat-culture", "/images/guided-travel/temple.jpg", [
    "Boudhanath is one of the largest spherical stupas in the world and the center of Tibetan Buddhism in Kathmandu. Pilgrims walk around it clockwise, spinning prayer wheels.",
    "Visit early in the morning or at dusk, when butter lamps are lit and the square is at its most atmospheric. Dress modestly and walk clockwise.",
  ]),
  post(11, "Best Time to Trek in Nepal: Month by Month", "2026-08-09", "sample-cat-guides", G(6), [
    "Nepal has two main trekking seasons: spring (March to May) and autumn (September to November). Both offer stable weather and good views.",
    "Winter treks suit lower altitudes and the monsoon suits rain-shadow regions such as Upper Mustang and Dolpo.",
  ]),
];

export interface SampleBlogQuery {
  page: number;
  perPage: number;
  search?: string;
  categoryId?: string;
}

export function querySampleBlogs({ page, perPage, search, categoryId }: SampleBlogQuery): { items: BlogPost[]; meta: PaginationMeta } {
  const needle = search?.toLowerCase();
  const matching = SAMPLE_BLOGS.filter(
    (blog) =>
      (!needle || blog.title.toLowerCase().includes(needle)) &&
      (!categoryId || blog.categories.some((category) => category.id === categoryId)),
  );
  const totalPages = Math.max(1, Math.ceil(matching.length / perPage));
  return {
    items: matching.slice((page - 1) * perPage, page * perPage),
    meta: {
      currentPage: page,
      perPage,
      total: matching.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}
