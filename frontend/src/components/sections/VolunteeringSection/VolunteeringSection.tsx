import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FillImage } from "@/components/ui/FillImage";

const itinerary = [
  ["Day 01", "Arrive in Kathmandu and drive to the Hotel."],
  ["Day 02", "Sightseeing in Kathmandu."],
  ["Day 03", "Kathmandu to Tirsuli by bus and hike to Samari."],
  ["Day 04", "Explore Samari Village, where an earthquake destroyed houses."],
  [
    "Day 05",
    "In the early morning, take a bus or car to Kathmandu, explore Patan Durbar Square, and then drive to Bhaktapur. Overnight at Bhaktapur.",
  ],
  ["Day 06", "Sightseeing around Bhaktapur and Shopping time."],
] as const;

const volunteeringOverview = (
  <>
    <p>
      <strong>Volunteering in Nepal</strong>, emphasizing the volunteer&apos;s work in Jyamrung village of Dhading and Samari village in Nuwakot district. The massive earthquakes of 25th April and 12th May caused colossal destruction in the villages, including the schools and health posts. As a part of our social responsibility, we want to contribute to some badly affected villages, and Jyamrung and Samari are among them. Similarly, we are focusing on rebuilding schools in Nepal&apos;s Annapurna and <a href="/manaslu-circuit-trek">Manaslu regions</a>.
    </p>
    <p>
      Suppose some of you would like to teach in school. These are also options. However, many children in Nepal have lost their parents and houses in Melamchi (Helambu) due to floods and landslides. We have many different areas for volunteers in Nepal. Let us know about your suitable work.
    </p>
  </>
);

const volunteeringDetails = (
  <>
    <p>
      The Nepal volunteer also includes world heritage tours in Kathmandu. You can tour around Kathmandu Durbar Square, Swayambhunath Temple, Pashupatinath Hindu Temple, Bhaktapur Durbar Square, <a href="/patan-durbar-square-tour">Patan Durbar Square</a>, and Boudhanath Stupa.
    </p>
    <p>
      The volunteer trekking trail goes through ethnic communities. The volunteering area is about a 5–6 hour drive northwest of Kathmandu and is particularly suitable for helping with activities such as teaching at local schools, organizing games, buying stationery for students, rebuilding health posts and community houses, and other social activities.
    </p>
    <p>
      During your volunteer trekking trip, you can enjoy a homestay service in the village. Local people can share their experiences with you, and you can stay connected with the community. The volunteer trek leads to the historic town of Gorkha, home to the famous Gorkha Durbar, before returning to Kathmandu.
    </p>
  </>
);

export function VolunteeringSection() {
  return (
    <>
      <section className="bg-brand-neutral-000 px-2 pt-2 md:px-[10px]">
        <div className="relative mx-auto min-h-[420px] max-w-[1420px] overflow-hidden rounded-card sm:min-h-[540px] lg:min-h-[640px]">
          <FillImage
            src="/images/gallery/everest-1.jpg"
            alt="Volunteers trekking through a Himalayan landscape"
            className="absolute inset-0 size-full object-cover object-center" sizes="(min-width:1024px) 50vw, 100vw" />
        </div>
      </section>

      <article className="bg-brand-neutral-000 px-5 py-8 font-poppins text-body-l text-brand-neutral-800 md:px-16">
        <div className="mx-auto w-full max-w-[1312px]">
          <Breadcrumbs
            tone="dark"
            className="[&_ol]:justify-start"
            items={[{ label: "Home", href: "/" }, { label: "Volunteering in Nepal" }]}
          />
          <h1 className="mt-7 font-playfair-display text-[36px] leading-[1.25] font-medium text-brand-neutral-1000 md:text-[44px]">
            Volunteering in Nepal
          </h1>

          <section className="mt-10 rounded-card bg-secondary-500 px-6 py-8 text-brand-neutral-1000 md:px-8">
            <h2 className="text-heading-2xl font-semibold">Volunteering in Nepal Trip Highlight</h2>
            <p className="mt-5 font-semibold">Our central goal is social work through volunteering in Nepal.</p>
            <ul className="mt-1 list-disc pl-6">
              <li>Help communities affected by Nepal&apos;s earthquakes.</li>
              <li>Take an excellent opportunity to explore Nepal&apos;s historic sites.</li>
              <li>Your helping hand can be a lifeline for local people.</li>
            </ul>
          </section>

          <div className="mt-9 space-y-3 leading-[1.6] [&_a]:text-primary-500 [&_a]:underline">
            {volunteeringOverview}
          </div>

          <ImagePair />

          <div className="mt-8 space-y-3 leading-[1.6] [&_a]:text-primary-500 [&_a]:underline">
            {volunteeringDetails}
          </div>

          <ImagePair />
          <ImageTriptych />

          <section className="mt-10">
            <h2 className="font-playfair-display text-[32px] leading-[1.3] font-medium text-brand-neutral-1000">
              Itinerary for Volunteering in Nepal
            </h2>
            <div className="mt-6 space-y-5 leading-[1.6]">
              <p>
                One of the beautiful trails in the Annapurna region is a trek from Ghorepani to Deurali. Departing from Ghorepani, you&apos;ll walk through different landscapes, experience different cultures, and move from dense forests to alpine meadows. After leaving Ghorepani, you&apos;ll cross the Deurali Pass and reach an elevation of 3,210 m, offering the same views of the mountain ranges as Poon Hill. As the trail heads, you&apos;ll see the locals doing their daily activities.
              </p>
              <p>Similarly, the trip leads you to the Annapurna Base Camp.</p>
            </div>
          </section>

          <section className="mt-8 rounded-card border border-secondary-500 bg-[#fff8f2] p-5 shadow-card-strong md:p-8">
            <h2 className="font-poppins text-[26px] leading-[1.4] font-bold text-brand-neutral-1000">
              Day-to-Day Short Itinerary
            </h2>
            <div className="mt-6 space-y-3">
              {itinerary.map(([day, description]) => (
                <div
                  key={day}
                  className="grid overflow-hidden rounded-[12px] border border-dashed border-primary-200 bg-primary-100 sm:grid-cols-[100px_1fr]"
                >
                  <p className="border-b border-primary-200 px-4 py-5 font-medium text-primary-500 sm:border-r sm:border-b-0">
                    {day}
                  </p>
                  <p className="px-4 py-5 font-medium text-brand-neutral-900">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 pb-4">
            <h2 className="font-playfair-display text-[32px] leading-[1.3] font-medium text-brand-neutral-1000">
              Contact Us
            </h2>
            <div className="mt-6 space-y-5 leading-[1.6]">
              <p>
                Tell us how you would like to help and how much time you have. Our team will shape a volunteering and travel plan around your interests.
              </p>
              <address className="not-italic">
                <strong className="text-primary-500">Joyful Trekking Pvt. Ltd.</strong><br />
                Paknajol Marga, Thamel<br />
                P.O. Box: 11670, Kathmandu, Nepal<br />
                <a className="text-primary-500 underline" href="mailto:joyfultrekking@gmail.com">joyfultrekking@gmail.com</a><br />
                <a className="text-primary-500 underline" href="mailto:joyfultrekking@gmail.com">joyfultrekking@gmail.com</a><br />
                Phone: +977 1 4701884, +977 1 4701885<br />
                Mobile / WhatsApp: <a className="text-primary-500 underline" href="https://wa.me/9779845000000">+977 9845000000</a>
              </address>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}

function ImagePair() {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <ContentImage src="/images/gallery/everest-6.jpg" alt="Prayer flags beside a frozen Himalayan stream" />
      <ContentImage src="/images/cta/plan-your-trip.jpg" alt="A mountain trail below the Himalayas" />
    </div>
  );
}

function ImageTriptych() {
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <ContentImage src="/images/gallery/everest-6.jpg" alt="Prayer flags beside a frozen Himalayan stream" square />
      <ContentImage src="/images/cta/plan-your-trip.jpg" alt="A mountain trail below the Himalayas" square />
      <ContentImage src="/images/cta/plan-your-trip.jpg" alt="A mountain trail below the Himalayas" square />
    </div>
  );
}

function ContentImage({ src, alt, square = false }: { src: string; alt: string; square?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-[16px] ${square ? "aspect-[1.12]" : "aspect-[1.82]"}`}>
      <FillImage src={src} alt={alt} className="absolute inset-0 size-full object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
    </div>
  );
}
