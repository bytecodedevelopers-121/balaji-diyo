export interface DestinationCard {
  label: string;
  href: string;
  image: string;
  /** Activity key in `TRIP_CATEGORIES` / sample trips, used for the package count. */
  categoryKey?: string;
}

export interface Destination {
  slug: string;
  name: string;
  heroImage: string;
  intro: string;
  /** Matches `SampleTrip.countries` for the sample package counts. */
  countryLabel: string;
  cards: DestinationCard[];
  /** CMS-style HTML article under the cards (h2/h3, paragraphs, blockquote notes). */
  contentHtml: string;
}

const NEPAL_CONTENT = `
<h2>Geography of Nepal</h2>
<p><strong>Nepal can be divided into three main geographical regions: the Himalayan region, the mid-hill region, and the Terai region.</strong> The highest point in the country is Mt. Everest (8,848 m), while the lowest point is in the Terai plains of Kechana Kalan in Jhapa (60 m).</p>
<p><strong>The Terai region, with a width of 26 to 32 km, occupies about 17 percent of the total land area of the country.</strong> It is the fertile southern lowland, home to farms, forests and national parks.</p>
<p><strong>The southern lowland Terai continues to the Bhabar belt covered with the Char Kose Jhadi forests known for rich wildlife.</strong> Further north, the Siwalik zone and the Mahabharat range give way to the Duns (valleys), such as Chitwan, Dang and Surkhet.</p>
<h3>Himalayan Ranges in Nepal</h3>
<p><strong>The Midlands (600 to 3,500 m), north of the Mahabharat range, is where the two beautiful valleys of Kathmandu and Pokhara lie, covered in terraced rice fields and surrounded by forested watersheds.</strong></p>
<blockquote><p>The Himalayas (above 3,000 m) comprise mountains, alpine pastures, and temperate forests limited by the tree-line (4,000 m) and snow line (5,500 m). Eight of the fourteen eight-thousanders of the world lie in Nepal: Sagarmatha (Mount Everest, 8,848 m), Kanchenjunga (8,586 m), Lhotse (8,516 m), Makalu (8,463 m), Cho Oyu (8,201 m), Dhaulagiri (8,167 m), Manaslu (8,163 m) and Annapurna (8,091 m).</p></blockquote>
<p><strong>The inner Himalayan valleys (above 3,600 m), such as Mustang and Dolpo, are cold deserts sharing characteristics with the Tibetan plateau.</strong> Nepal holds the so-called water tower of South Asia, with its thousands of snow-fed and rain-fed rivers.</p>
<h3>Wildlife in the Jungle in Terai in Nepal</h3>
<p><strong>The perennial rivers include Mahakali, Karnali, Narayani, and Koshi, which originate in the Himalayas.</strong> Medium-sized rivers like Babai, West Rapti, Bagmati, Kamala, Kankai, and Mechi originate in the Midlands and Mahabharat range, while a large number of seasonal streams flow across the Terai.</p>
<h2>History of Nepal</h2>
<p><strong>Records mention the Gopalas and Mahishapalas as the earliest rulers of the Kathmandu Valley.</strong> From the 7th or 8th century B.C. the Kirantis are said to have ruled the valley, and around 300 A.D. the Lichhavis arrived from northern India and overthrew the Kirantis.</p>
<p><strong>One of the legacies of the Lichhavis is the Changu Narayan Temple near Bhaktapur, a UNESCO World Heritage Site.</strong> The Lichhavis brought art and architecture to the valley, and the golden age of creativity arrived in 1200 A.D. with the Mallas.</p>
<p><strong>During their 550-year rule, the Mallas built numerous temples and splendid palaces with picturesque squares.</strong> After the death of Yaksha Malla, the valley was divided into three kingdoms: Kathmandu (Kantipur), Bhaktapur (Bhadgaon), and Patan (Lalitpur).</p>
<blockquote><p>An ambitious Gorkha King named Prithvi Narayan Shah embarked on a conquering mission that led to the defeat of all the kingdoms in the valley by 1768. Prithvi Narayan decided to move his capital to Kathmandu, establishing the Shah dynasty which ruled a unified Nepal.</p></blockquote>
<p><strong>In the mid-19th century, Jung Bahadur Rana became Nepal's first prime minister to wield absolute power.</strong> The Rana rule lasted 104 years, until a democracy movement in the early 1950s restored the monarchy to power.</p>
<p><strong>After many years of struggle, a People's Movement in 1990 established a multiparty parliament.</strong> After the second People's Movement of 2006 and the Comprehensive Peace Agreement, the newly elected Constituent Assembly declared Nepal a Federal Democratic Republic in 2008.</p>
<h2>People and language in Nepal</h2>
<p><strong>The population of Nepal is about 29 million according to the 2021 census.</strong> The population comprises more than 100 ethnic groups speaking over 90 languages. Nepali is the national language of unification.</p>
<blockquote><p>Nepali is the official language of the state, spoken and understood by the majority of the population. Multiple ethnic groups have their own mother tongues. English is spoken by many in government and business offices and is the medium of education in most private schools of Kathmandu and other cities.</p></blockquote>
<h3>Northern Himalayan People</h3>
<p><strong>In the northern region of the Himalayas live the Tibetan-speaking groups, namely Sherpas, Dolpo-pas, Lopas, Baragaonlis, and Manangis.</strong> The Sherpas are mainly found in the east, in the Solu and Khumbu regions, while the Manangis live in the Manang district.</p>
<h3>Middle Hills and Valley People</h3>
<p><strong>Several ethnic groups live in the middle hills and valleys of Nepal.</strong> Among them are the Magars, Gurungs, Rais, Limbus, Tamangs, Sunuwars, Newars, Thakalis, Chepangs, Brahmins and Chhetris.</p>
<h3>Ethnic Diversity in the Kathmandu Valley</h3>
<p><strong>The Kathmandu Valley is a cultural cauldron of the country.</strong> The native people of the valley are the Newars, and Newari culture is an integration of both Hinduism and Buddhism.</p>
<h3>Terai People</h3>
<p><strong>The main ethnic groups in Terai are Tharus, Darai, Kumhal, Majhi, and others.</strong> They speak north Indian dialects like Maithili and Bhojpuri, and most inhabitants live on agriculture.</p>
<h3>Religions in Nepal</h3>
<p><strong>Nepal was declared a secular country by the Parliament on May 18, 2006.</strong> Religions practiced in Nepal include Hinduism, Buddhism, Islam, Christianity, Jainism, Sikhism, Bon, and ancestor worship. The majority of Nepalese are Hindus, and Hinduism and Buddhism have co-existed in harmony through centuries.</p>
<blockquote><p>The Lord Buddha is widely worshipped by both Buddhists and Hindus of Nepal. Kumari, the Virgin Goddess, also represents Shakti, and other popular deities are Ganesh for luck, Saraswati for knowledge, Lakshmi for wealth, and Hanuman for protection.</p></blockquote>
`;

const G = (n: number) => `/images/gallery/everest-${n}.jpg`;

/** Country landing pages: `/destination/<slug>`. */
export const DESTINATIONS: Destination[] = [
  {
    slug: "nepal",
    name: "Nepal",
    heroImage: G(2),
    countryLabel: "Nepal",
    intro:
      "Nepal is a country of Himalayas, nature, and culture, and Nepal has plenty of places to visit. Kathmandu is the capital city of Nepal, which has many UNESCO Cultural heritage sites with unique arts and architecture, history, stories, and myths.",
    cards: [
      { label: "Trekking and Hiking", href: "/trekking-routes-in-nepal", image: "/images/about-us/trail-1-overlook.jpg", categoryKey: "trekking" },
      { label: "Climbing and Expedition", href: "/nepal-peak-climbing", image: G(1), categoryKey: "climbing" },
      { label: "Jungle and Wildlife Safari", href: "/nepal-tour-packages", image: "/images/about-us/trail-5-ridge.jpg", categoryKey: "safari" },
      { label: "Nepal Festival Tours", href: "/nepal-tour-packages", image: "/images/about-us/trail-4-bridge.jpg" },
      { label: "Nepal Tours and Holidays", href: "/nepal-tour-packages", image: "/images/guided-travel/temple.jpg", categoryKey: "tours" },
      { label: "Day Tours and Activities", href: "/nepal-day-tours", image: "/images/about-us/trail-3-group.jpg", categoryKey: "day" },
    ],
    contentHtml: NEPAL_CONTENT,
  },
  {
    slug: "bhutan",
    name: "Bhutan",
    heroImage: "/images/plan-with-us/bhutan.jpg",
    countryLabel: "Bhutan",
    intro:
      "Bhutan is a small Himalayan kingdom known for its dzong fortresses, cliff-side monasteries, festivals and a culture that measures national progress by Gross National Happiness.",
    cards: [
      { label: "Bhutan Culture Tours", href: "/plan-your-trip", image: "/images/guided-travel/temple.jpg" },
      { label: "Bhutan Treks", href: "/plan-your-trip", image: "/images/about-us/trail-2-path.jpg" },
    ],
    contentHtml: `
<h2>Geography of Bhutan</h2>
<p><strong>Bhutan lies in the eastern Himalayas between Tibet and India.</strong> Its land rises from subtropical plains in the south to snow peaks above 7,000 meters in the north, and more than two-thirds of the country is covered by forest.</p>
<h2>Culture and People</h2>
<p><strong>Buddhism shapes daily life in Bhutan.</strong> Prayer flags, chortens and monasteries are everywhere, and the national dress, architecture and festivals (tshechu) are strongly protected.</p>
<blockquote><p>All visitors travel with a licensed guide and pay a daily Sustainable Development Fee. See our Bhutan travel guide for visa and fee details.</p></blockquote>
`,
  },
  {
    slug: "tibet",
    name: "Tibet",
    heroImage: "/images/plan-with-us/tibet.jpg",
    countryLabel: "Tibet",
    intro:
      "Tibet is the high plateau of monasteries, sacred Mount Kailash and the Potala Palace in Lhasa, with some of the most dramatic landscapes in Asia.",
    cards: [
      { label: "Tibet Culture Tours", href: "/plan-your-trip", image: "/images/guided-travel/temple.jpg" },
      { label: "Mount Kailash Pilgrimage", href: "/plan-your-trip", image: G(3) },
    ],
    contentHtml: `
<h2>Geography of Tibet</h2>
<p><strong>Tibet sits at an average altitude of about 4,500 meters and is often called the Roof of the World.</strong> The plateau holds the sources of several of Asia's great rivers, and the north side of Mount Everest rises on its southern border.</p>
<h2>Culture and People</h2>
<p><strong>Tibetan Buddhism is at the heart of Tibetan life.</strong> Monasteries such as Jokhang, Drepung and Tashilhunpo, and pilgrimage circuits around Mount Kailash, draw visitors and devotees alike.</p>
<blockquote><p>Foreign visitors need a Tibet Travel Permit arranged by a licensed operator. See our Tibet travel guide for permit and visa details.</p></blockquote>
`,
  },
];

export function getDestination(slug: string): Destination | undefined {
  return DESTINATIONS.find((destination) => destination.slug === slug);
}
