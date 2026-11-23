/**
 * Copy + form definitions for the /become-a-partner page, transcribed from
 * the client's partnership copywriting brief (partnerreq.txt). Kept as
 * typed constants, not inline JSX, so the client can revise wording
 * without touching layout code.
 *
 * Every class-name string here is a full, static Tailwind class (never
 * built by concatenation) so Tailwind's scanner still picks it up.
 */

export const partnerHero = {
  eyebrow: "Partnership Programme",
  headlineLead: "Grow Your Brand on the",
  headlineAccent: "Roof of the World.",
  subheadline:
    "Your Company Pvt. Ltd. runs treks, peak climbs, cultural tours, and private group journeys across the Himalayas. Every package is open to partnership. Pick your model and let’s get started.",
  primaryCta: "Apply to Partner",
  secondaryLink: "See what’s on offer",
  stats: [
    { value: "8,849m", label: "Above Sea Level", accent: false },
    { value: "12+", label: "Expedition Routes", accent: false },
    { value: "48h", label: "Response Guarantee", accent: true },
  ],
} as const;

export const partnerModels = {
  label: "Who We Work With",
  heading: "Three Ways to Partner With Your Company Pvt. Ltd.",
  body: "Want to co-create a trek? Earn commission on every booking you send? Or shoot content on the trail? We have a partnership model that fits each goal.",
  cards: [
    {
      tag: "For Brands & Sponsors",
      heading: "Brand & Sponsorship Partners",
      description:
        "Put your brand in one of the world’s most extreme places. Co-brand an EBC trek. Add your logo to a summit attempt. Your product earns real credibility at altitude.",
      bulletClassName: "text-primary-500",
      perks: [
        "Logo on expedition gear, vehicles, and base camps",
        "Sponsored expedition naming rights",
        "Co-branded trek experiences for your customers",
        "Photo and video content library from the trail",
        "Authentic adventure stories for your campaigns",
      ],
    },
    {
      tag: "For Influencers & Creators",
      heading: "Creator & Influencer Partners",
      description:
        "Nothing stops a scroll like the Himalayas. Join a trek, shoot content that performs, and give your audience a milestone they will remember.",
      bulletClassName: "text-secondary-500",
      perks: [
        "Free or subsidised trek spots for qualifying creators",
        "Dedicated content days at iconic locations on the trail",
        "Drone, photo, and production support",
        "Affiliate commission on every booking you refer",
        "Cross-promotion across Your Company channels",
      ],
    },
    {
      tag: "For Agencies & Resellers",
      heading: "Agency & Reseller Partners",
      description:
        "Give your clients the Himalayas without the logistics headache. Tap into our full package range, treks, peak climbs, cultural tours, and day hikes, and earn a recurring commission on every booking you send.",
      bulletClassName: "text-primary-900",
      perks: [
        "Competitive commission structure on all bookings",
        "White-label and co-branded itinerary options",
        "Dedicated partner account manager",
        "Priority access for private and corporate group slots",
        "Sales collateral, brochures, and co-marketing support",
      ],
    },
  ],
} as const;

export const partnerOffers = {
  label: "What’s On The Table",
  heading: "Real Assets. Real Altitude. Real Reach.",
  body: "These are not generic perks. Every benefit ties to a real package, a real location, and a real audience in the Himalayas. Treks, peak climbs, cultural tours, and private expeditions are all on the table.",
  items: [
    {
      kicker: "Offer 01",
      heading: "On-Trail Content Creation",
      body: "Shoot at Namche Bazaar, Tengboche Monastery, Kala Patthar, and Base Camp. You get real landscapes, human stories, and brand content that no studio can match.",
    },
    {
      kicker: "Offer 02",
      heading: "Co-Branded Expeditions",
      body: "Design and name a trek with us. Your brand runs through the whole experience, from marketing to summit certificates to the moment your clients reach 5,364m.",
    },
    {
      kicker: "Offer 03",
      heading: "Referral and Commission Programme",
      body: "You earn a clear commission on every booking you generate. We track it simply, pay promptly, and set no minimum threshold before you start earning.",
    },
    {
      kicker: "Offer 04",
      heading: "Expedition Naming and Logo Rights",
      body: "Your brand name goes on the expedition gear, team clothing, base camp banners, and every piece of content we publish from the journey.",
    },
  ],
} as const;

export const partnerProcess = {
  label: "How It Works",
  heading: "From First Contact to First Summit",
  body: "Simple, fast, and built around your goals. We reply to every partnership inquiry within 48 hours. No chasing needed.",
  steps: [
    {
      heading: "Submit Your Inquiry",
      body: "Tell us who you are and what you want from a partnership. A few lines is enough to get started.",
    },
    {
      heading: "We Reply in 48 Hours",
      body: "A real person on our team reads your submission and replies within two business days. Every time.",
    },
    {
      heading: "Discovery Call",
      body: "We talk through your goals, timing, and the best partnership structure. No pressure. Just a straight conversation.",
    },
    {
      heading: "We Go to the Mountains",
      body: "Your partnership starts. Content gets made, commissions come in, and your audience sees something worth watching.",
    },
  ],
} as const;

export const partnerFormIntro = {
  label: "Start the Conversation",
  heading: "Let’s Build Something at Altitude",
  body: "Fill in the form and our partnerships team will reach out within 48 hours. We read every submission. Your goals drive the conversation.",
  trustSignals: [
    {
      icon: "48h",
      heading: "48-Hour Response Guarantee",
      body: "A real team member reads your form and replies within two business days. Not a bot.",
    },
    {
      icon: "lock",
      heading: "Confidential and No Obligation",
      body: "We keep your details private. Sending this form does not commit you to anything.",
    },
    {
      icon: "globe",
      heading: "Nepal-Based, Globally Connected",
      body: "Deep local expertise with the professional setup that international partners expect.",
    },
  ],
} as const;

export type PartnerFormId = "brand" | "creator" | "agency";

export const PARTNER_FORM_IDS: readonly PartnerFormId[] = ["brand", "creator", "agency"];

export interface PartnerFormField {
  /** Stable key — also the state key for the field's value. */
  key: string;
  /** Used as the visible label (sr-only) and as the line label in the submitted message. */
  label: string;
  kind: "text" | "email" | "select";
  options?: readonly string[];
  /** Two short fields share one row from `sm` up. */
  half?: boolean;
  required?: boolean;
}

export interface PartnerFormDefinition {
  id: PartnerFormId;
  tabLabel: string;
  /** Sent as the ContactMessage `type` so admin can tell the three forms apart. */
  submitType: string;
  fields: readonly PartnerFormField[];
  /** Keys joined (in order) into the ContactMessage `name`. */
  nameKeys: readonly string[];
  /** Key whose value is the ContactMessage `email`. */
  emailKey: string;
  textareaLabel: string;
  textareaPlaceholder: string;
  submitLabel: string;
  note: string;
}

const FORM_NOTE = "We respond within 48 hours. No sales scripts.";

export const partnerForms: readonly PartnerFormDefinition[] = [
  {
    id: "brand",
    tabLabel: "Brand / Sponsor",
    submitType: "partner-brand",
    nameKeys: ["firstName", "lastName"],
    emailKey: "email",
    fields: [
      { key: "firstName", label: "First Name", kind: "text", half: true, required: true },
      { key: "lastName", label: "Last Name", kind: "text", half: true, required: true },
      { key: "brandName", label: "Business / Brand Name", kind: "text", required: true },
      { key: "email", label: "Work Email", kind: "email", required: true },
      {
        key: "industry",
        label: "Industry / Vertical",
        kind: "select",
        required: true,
        options: [
          "Outdoor & Adventure Gear",
          "Corporate Wellness & Team Building",
          "Tourism Board / Travel Media",
          "Health, Fitness & Lifestyle",
          "Technology",
          "Food & Nutrition",
          "Other",
        ],
      },
    ],
    textareaLabel: "What Are You Looking For?",
    textareaPlaceholder:
      "Tell us your goals. Content creation, brand placement, a co-branded trek, or something else. The more you share, the better we can help.",
    submitLabel: "Submit Partnership Inquiry",
    note: FORM_NOTE,
  },
  {
    id: "creator",
    tabLabel: "Creator",
    submitType: "partner-creator",
    nameKeys: ["firstName", "lastName"],
    emailKey: "email",
    fields: [
      { key: "firstName", label: "First Name", kind: "text", half: true, required: true },
      { key: "lastName", label: "Last Name", kind: "text", half: true, required: true },
      {
        key: "platform",
        label: "Primary Platform",
        kind: "select",
        half: true,
        required: true,
        options: ["Instagram", "YouTube", "TikTok", "Blog", "Podcast", "Multiple"],
      },
      {
        key: "following",
        label: "Total Following",
        kind: "select",
        half: true,
        required: true,
        options: ["10K–50K", "50K–200K", "200K–500K", "500K–1M", "1M+"],
      },
      { key: "profileLink", label: "Contact / Profile Link", kind: "text", required: true },
      { key: "email", label: "Your Email", kind: "email", required: true },
    ],
    textareaLabel: "Tell Us About Your Content & Goals",
    textareaPlaceholder:
      "What kind of content do you make? What does your ideal Himalayan trip look like?",
    submitLabel: "Submit Creator Inquiry",
    note: FORM_NOTE,
  },
  {
    id: "agency",
    tabLabel: "Agency / Reseller",
    submitType: "partner-agency",
    nameKeys: ["name"],
    emailKey: "email",
    fields: [
      { key: "name", label: "Your Name", kind: "text", half: true, required: true },
      { key: "role", label: "Your Role", kind: "text", half: true, required: true },
      { key: "company", label: "Agency / Company Name", kind: "text", required: true },
      { key: "email", label: "Business Email", kind: "email", required: true },
      {
        key: "volume",
        label: "Annual Booking Volume",
        kind: "select",
        half: true,
        required: true,
        options: ["Under 50", "50–200", "200–500", "500+"],
      },
      { key: "markets", label: "Primary Markets You Serve", kind: "text", half: true, required: true },
    ],
    textareaLabel: "What Does an Ideal Partnership Look Like?",
    textareaPlaceholder:
      "White-label itineraries, group allocations, commission structure. Tell us what you need.",
    submitLabel: "Submit Agency Inquiry",
    note: FORM_NOTE,
  },
];
