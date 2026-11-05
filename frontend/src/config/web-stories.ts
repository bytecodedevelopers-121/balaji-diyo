export interface WebStorySlide {
  image: string;
  caption: string;
}

export interface WebStory {
  slug: string;
  title: string;
  /** Card cover; also the first slide's background in the viewer. */
  cover: string;
  slides: WebStorySlide[];
}

// Placeholder photos reused from existing assets; swap for real story images when available.
const G = (n: number) => `/images/gallery/everest-${n}.jpg`;
const T = (n: number, name: string) => `/images/about-us/trail-${n}-${name}.jpg`;

/** Nepal Travel Web Stories: `/travel-web-stories` (list) → `/web-stories/<slug>` (full-screen viewer). */
export const WEB_STORIES: WebStory[] = [
  {
    slug: "explore-everest-base-camp",
    title: "Explore Everest Base Camp in 7 Stories",
    cover: G(1),
    slides: [
      { image: G(1), caption: "Everest Base Camp sits at about 5,364 meters in the Khumbu region." },
      { image: G(2), caption: "Most trekkers fly from Kathmandu to Lukla to begin the trek." },
      { image: G(3), caption: "Namche Bazaar is the Sherpa capital and a key acclimatization stop." },
      { image: G(4), caption: "Tengboche Monastery offers views of Everest, Lhotse and Ama Dablam." },
      { image: G(5), caption: "Yaks carry gear along the high-altitude trails." },
      { image: G(6), caption: "Gorak Shep is the last settlement before Base Camp." },
      { image: T(1, "overlook"), caption: "Standing at Base Camp is a moment you will never forget." },
    ],
  },
  {
    slug: "explore-chitwan-national-park",
    title: "Explore Chitwan National Park",
    cover: T(2, "path"),
    slides: [
      { image: T(2, "path"), caption: "Chitwan National Park is a UNESCO World Heritage Site in the Terai plains." },
      { image: T(4, "bridge"), caption: "Jeep and walking safaris take you through grassland and jungle." },
      { image: T(5, "ridge"), caption: "Spot one-horned rhinoceros, deer, crocodiles and hundreds of bird species." },
      { image: T(3, "group"), caption: "Experience Tharu culture, dance and local food in nearby villages." },
      { image: G(2), caption: "The best time to visit is October to March." },
    ],
  },
  {
    slug: "explore-boudhanath-stupa",
    title: "Explore Boudhanath Stupa",
    cover: "/images/guided-travel/temple.jpg",
    slides: [
      { image: "/images/guided-travel/temple.jpg", caption: "Boudhanath is one of the largest stupas in the world." },
      { image: G(3), caption: "Prayer flags and butter lamps fill the square around it." },
      { image: T(3, "group"), caption: "Walk clockwise around the stupa, as pilgrims have done for centuries." },
      { image: G(5), caption: "The painted eyes of the Buddha watch over Kathmandu." },
    ],
  },
  {
    slug: "sunrise-in-the-himalayas",
    title: "Sunrise in the Himalayas",
    cover: "/images/cta/gokyo-lake-yak.jpg",
    slides: [
      { image: "/images/cta/gokyo-lake-yak.jpg", caption: "Early mornings in the mountains are cold, quiet and unforgettable." },
      { image: T(1, "overlook"), caption: "Poon Hill, Kalapatthar and Nagarkot are classic sunrise viewpoints." },
      { image: G(4), caption: "First light turns the snow peaks gold and pink." },
      { image: G(6), caption: "Carry a warm jacket and a headlamp for the climb." },
      { image: T(5, "ridge"), caption: "Your guide will wake you in time for the best light." },
      { image: T(2, "path"), caption: "Breakfast always tastes better with a view." },
      { image: G(1), caption: "Join us and see the Himalayas wake up." },
    ],
  },
];

export function getWebStory(slug: string): WebStory | undefined {
  return WEB_STORIES.find((story) => story.slug === slug);
}
