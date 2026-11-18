import type { FieldDef, PageDef, SectionDef } from "@/types/page-content";

/**
 * Which pages the page-content CMS edits, and the fields of each section.
 * Section keys and field keys match the website's defaults file
 * (frontend/src/features/page-content/*-defaults.json) — change them together.
 */

/** Platforms with their own coloured icon; any other name still shows a neutral link icon. */
const SOCIAL_PLATFORMS = ["Facebook", "X", "Instagram", "LinkedIn", "YouTube", "Pinterest", "TikTok", "WhatsApp", "Telegram"];

const text = (key: string, label: string, hint?: string): FieldDef => ({ key, label, kind: "text", hint });
const area = (key: string, label: string, hint?: string): FieldDef => ({ key, label, kind: "textarea", hint });
const link = (key: string, label: string): FieldDef => ({ key, label, kind: "url", hint: "A site path such as /blog, or a full https:// address." });
const count = (key: string, label: string, hint: string): FieldDef => ({ key, label, kind: "number", hint });

/** The eyebrow / title / button trio most listing sections share. */
const heading = (eyebrow = "Small label above the title"): FieldDef[] => [
  text("eyebrow", "Small label", eyebrow),
  text("title", "Title"),
  text("buttonLabel", "Button text"),
  link("buttonHref", "Button link"),
];

const rich = (key: string, label: string, hint?: string): FieldDef => ({ key, label, kind: "richtext", hint });
const img = (key: string, label: string): FieldDef => ({ key, label, kind: "image", hint: "Pick one from the media library or upload a new one." });

const SEO: SectionDef = {
  key: "seo",
  title: "Search & browser title",
  description: "The page title and description shown in Google results and browser tabs.",
  fields: [text("title", "Page title"), area("description", "Meta description")],
};

/** A text page: heading + one rich-text body (and an optional top photo). */
const proseDef = (key: string, title: string, path: string, withImage: boolean, note = ""): PageDef => ({
  key,
  title,
  description: `The heading and whole text of the ${title} page, written in the text editor.${note ? " " + note : ""}`,
  path,
  sections: [
    SEO,
    {
      key: "content",
      title: "Page text",
      description: "Heading, photo (if the page has one) and the full text with headings, bold, lists and links.",
      fields: [
        text("title", "Page heading"),
        ...(withImage ? [img("image", "Top photo"), text("imageAlt", "Photo description (alt text)")] : []),
        rich("body", "Page text"),
      ],
    },
  ],
});

export const PAGE_DEFS: PageDef[] = [
  {
    key: "site",
    title: "Contact details & social links",
    description: "Address, email, phone numbers and social media links shown in the footer, header menu and Contact page.",
    path: "/contact",
    sections: [
      {
        key: "contact",
        title: "Contact details",
        description: "Used in the footer, the Contact Us page and the mobile menu. Leave a field empty to keep the value from Global Settings.",
        fields: [
          text("address", "Address"),
          { key: "email", label: "Email", kind: "text" },
          text("phone", "Office phone", "e.g. +977 14701884"),
          text("secondaryPhone", "Second office phone"),
          text("mobile", "Mobile / WhatsApp number", "Also used for the WhatsApp link and the header phone."),
        ],
      },
      {
        key: "social",
        title: "Social media links",
        description: "Add, remove and reorder the icons shown in the footer and Contact page. Links without a platform or address are ignored.",
        fields: [
          {
            key: "links",
            label: "Social links",
            kind: "list",
            itemLabel: "link",
            itemFields: [
              { key: "label", label: "Platform", kind: "select", options: SOCIAL_PLATFORMS },
              { key: "href", label: "Profile address", kind: "url", hint: "The full https:// address of your profile or page." },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "home",
    title: "Home page",
    description: "Every section of the homepage, in the order visitors see them.",
    path: "/",
    sections: [
      {
        key: "hero",
        title: "Hero",
        description: "Top banner: welcome badge, typed headline, category cards and the scrolling destinations strip.",
        fields: [
          text("badge", "Welcome badge"),
          text("headlineLine1", "Headline — first line"),
          text("headlineLine2", "Headline — second line (yellow)"),
          text("headlinePrefix", "Hidden headline prefix", "Read by search engines and screen readers only."),
          area("description", "Description"),
          {
            key: "categories",
            label: "Category cards",
            kind: "list",
            itemLabel: "card",
            itemFields: [
              text("label", "Label"),
              text("sub", "Subtitle", "Shown when the card has no package count."),
              link("href", "Link"),
              { key: "image", label: "Image", kind: "image", hint: "Leave empty for the tag icon." },
              text("countSlug", "Count packages of category slug", "Optional, e.g. nepal-peak-climbing. Shows “N Packages”."),
            ],
          },
          {
            key: "places",
            label: "Scrolling destinations",
            kind: "list",
            itemLabel: "destination",
            itemFields: [text("name", "Name")],
          },
        ],
      },
      {
        key: "bestSellers",
        title: "Best Sellers",
        description: "Coverflow of popular packages. Which trips appear is set with “Popular” on each package.",
        fields: [...heading(), count("maxCards", "Number of trips", "How many popular trips to show.")],
      },
      {
        key: "upcomingTrips",
        title: "Upcoming Trips",
        description: "Departures table. Rows come from the Departures data.",
        fields: [
          ...heading(),
          count("maxRows", "Number of departures", "How many rows to show."),
          text("noteTitle", "Note title"),
          area("noteBody", "Note text"),
        ],
      },
      {
        key: "featuredTours",
        title: "Featured Tours",
        description: "“10 Best Tours” scatter of cards. Which trips appear is set with “Featured” on each package.",
        fields: [
          text("badge", "Badge"),
          text("titleLine1", "Title — first line"),
          text("titleLine2", "Title — second line (yellow)"),
          area("description", "Description"),
          text("buttonLabel", "Button text"),
          link("buttonHref", "Button link"),
          count("maxCards", "Number of trips", "Up to 10 fit the layout."),
        ],
      },
      {
        key: "exploreNepal",
        title: "Explore Nepal / Why Choose Us",
        description: "Company intro with the “Why Choose Us?” accordion.",
        fields: [
          text("eyebrow", "Small label"),
          text("title", "Title"),
          { key: "bodyHtml", label: "Intro text", kind: "html", hint: "Simple HTML: <p> paragraphs and <strong> for bold." },
          text("buttonLabel", "Button text"),
          link("buttonHref", "Button link"),
          text("whyTitle", "Accordion title"),
          {
            key: "whyItems",
            label: "Accordion items",
            kind: "list",
            itemLabel: "item",
            itemFields: [text("title", "Title"), area("body", "Text")],
          },
          { key: "backgroundImage", label: "Background photo", kind: "image" },
        ],
      },
      {
        key: "clientReviews",
        title: "Client Reviews",
        description: "Review-platform ratings and the featured testimonials. Which reviews appear is set with “Featured” on each testimonial.",
        fields: [
          text("badge", "Badge"),
          text("titleLine1", "Title — first line"),
          text("titleLine2", "Title — second line (yellow)"),
          {
            key: "platforms",
            label: "Review platforms",
            kind: "list",
            itemLabel: "platform",
            itemFields: [text("name", "Name", "Tripadvisor, Google Reviews or Trustpilot get their brand colour."), text("meta", "Count text", "e.g. 287 reviews")],
          },
          text("buttonLabel", "Button text"),
          link("buttonHref", "Button link"),
          count("maxCards", "Number of reviews", "How many featured testimonials to show."),
        ],
      },
      {
        key: "webStories",
        title: "Web Stories",
        description: "Story tiles. The stories themselves are managed under Web Stories.",
        fields: [...heading(), count("maxCards", "Number of stories", "How many tiles to show.")],
      },
      {
        key: "faqGuided",
        title: "FAQs & Guided Travel",
        description: "Blue band: FAQ accordion on the left, “Why Guided Travel?” points on the right.",
        fields: [
          text("faqEyebrow", "FAQ — small label"),
          text("faqTitle", "FAQ — title"),
          {
            key: "faqs",
            label: "FAQs",
            kind: "list",
            itemLabel: "question",
            itemFields: [text("q", "Question"), area("a", "Answer")],
          },
          text("faqButtonLabel", "FAQ button text"),
          link("faqButtonHref", "FAQ button link"),
          text("guidedEyebrow", "Guided travel — small label"),
          text("guidedTitle", "Guided travel — title"),
          {
            key: "points",
            label: "Guided travel points",
            kind: "list",
            itemLabel: "point",
            itemFields: [text("title", "Title"), area("body", "Text")],
          },
        ],
      },
      {
        key: "travelNews",
        title: "Travel News",
        description: "Latest blog posts. The posts themselves are managed under Blogs.",
        fields: [...heading(), count("maxCards", "Number of posts", "How many posts to show.")],
      },
      {
        key: "associatedWith",
        title: "Associated With",
        description: "Trade-body and government logos strip.",
        fields: [
          text("title", "Title"),
          {
            key: "partners",
            label: "Partners",
            kind: "list",
            itemLabel: "partner",
            itemFields: [text("name", "Name"), { key: "src", label: "Logo", kind: "image" }],
          },
        ],
      },
      {
        key: "cta",
        title: "Call to Action",
        description: "Yellow “Ready for the Himalaya Holidays?” banner above the footer.",
        fields: [
          text("title", "Title"),
          area("description", "Description"),
          text("buttonLabel", "Button text"),
          link("buttonHref", "Button link"),
        ],
      },
    ],
  },
  {
    key: "contact",
    title: "Contact Us page",
    description: "Headings, opening hours, contact labels, map text and the closing banner of the Contact Us page.",
    path: "/contact",
    sections: [
      {
        key: "seo",
        title: "Search & browser title",
        description: "The page title and description shown in Google results and browser tabs.",
        fields: [text("title", "Page title"), area("description", "Meta description")],
      },
      {
        key: "intro",
        title: "Intro & opening hours",
        description: "Heading, subtitle and the “We are Opened” list at the top of the page.",
        fields: [
          text("title", "Page heading"),
          text("subtitle", "Subtitle"),
          text("openedTitle", "Opening hours heading"),
          { key: "openedItems", label: "Opening hours lines", kind: "list", itemLabel: "line", itemFields: [text("text", "Text")] },
          text("salesTitle", "Sales heading"),
          text("salesNote", "Note after the mobile number", "e.g. (24/7)"),
        ],
      },
      {
        key: "details",
        title: "Contact details card",
        description: "Labels of the navy card. The phone numbers, email and address themselves are edited in Global Settings.",
        fields: [
          text("companyName", "Company name above the card", "Leave empty to use the company name from Global Settings."),
          text("addressLabel", "Address label"),
          text("phoneLabel", "Phone label"),
          text("mobileLabel", "Mobile label"),
          text("emailLabel", "Email label"),
          text("hoursLabel", "Opening hours label"),
          text("hoursText", "Opening hours text"),
        ],
      },
      {
        key: "map",
        title: "Map",
        description: "The “Our Location” map.",
        fields: [
          text("title", "Heading"),
          text("buttonLabel", "“Open in Maps” text"),
          text("searchText", "Map search text", "Leave empty to search for the office address."),
        ],
      },
      {
        key: "cta",
        title: "Call to Action",
        description: "Yellow banner at the bottom of the page.",
        fields: [text("title", "Title"), area("description", "Description"), text("buttonLabel", "Button text"), link("buttonHref", "Button link")],
      },
    ],
  },
  {
    key: "affiliate",
    title: "Affiliate Program page",
    description: "Headings, paragraphs, form text and the closing banner of the Affiliate Program page.",
    path: "/affiliate-program",
    sections: [
      {
        key: "seo",
        title: "Search & browser title",
        description: "The page title and description shown in Google results and browser tabs.",
        fields: [text("title", "Page title"), area("description", "Meta description")],
      },
      {
        key: "intro",
        title: "Page text",
        description: "The page heading and the whole text of the page, written in the text editor (headings, bold, lists, links).",
        fields: [
          text("title", "Page heading"),
          { key: "body", label: "Page text", kind: "richtext", hint: "Shown above the application form." },
        ],
      },
      {
        key: "form",
        title: "Application form",
        description: "Form heading, button text and the message shown after a successful submission.",
        fields: [text("title", "Form heading"), text("submitLabel", "Submit button text"), area("successMessage", "Success message")],
      },
    ],
  },
  {
    key: "webstories",
    title: "Travel Web Stories page",
    description: "The top photo and heading of the Nepal Travel Web Stories page. The story cards themselves are managed under Travel → Web Stories.",
    path: "/travel-web-stories",
    sections: [
      {
        key: "seo",
        title: "Search & browser title",
        description: "The page title and description shown in Google results and browser tabs.",
        fields: [text("title", "Page title"), area("description", "Meta description")],
      },
      {
        key: "hero",
        title: "Top photo & heading",
        description: "The wide thumbnail image at the top of the page and the page heading.",
        fields: [
          text("title", "Page heading"),
          { key: "image", label: "Top image", kind: "image", hint: "Wide photo (about 16:7). Pick one from the media library or upload a new one." },
          text("imageAlt", "Image description (alt text)"),
        ],
      },
    ],
  },
  {
    key: "about",
    title: "About Us",
    description: "Hero, company story, statistics, photos and the history timeline of the About Us page.",
    path: "/company/about-us",
    sections: [
      SEO,
      {
        key: "hero",
        title: "Top banner",
        description: "Heading, subtitle and photo at the top of the page.",
        fields: [text("title", "Heading"), area("subtitle", "Subtitle"), img("image", "Photo"), text("imageAlt", "Photo description (alt text)")],
      },
      {
        key: "story",
        title: "Who we are",
        description: "The story text, photo collage, statistics band and photo strip.",
        fields: [
          text("label", "Small label"),
          text("heading", "Heading"),
          text("headingAccent", "Highlighted word(s) in the heading", "Shown in yellow italics."),
          rich("body", "Story text"),
          { key: "collage", label: "Photo collage (first photo is the wide one)", kind: "list", itemLabel: "photo", itemFields: [img("image", "Photo"), text("imageAlt", "Description (alt text)")] },
          { key: "stats", label: "Statistics", kind: "list", itemLabel: "statistic", itemFields: [text("value", "Number"), text("label", "Label")] },
          { key: "strip", label: "Photo strip", kind: "list", itemLabel: "photo", itemFields: [img("image", "Photo"), text("imageAlt", "Description (alt text)")] },
        ],
      },
      {
        key: "history",
        title: "Our History",
        description: "The timeline rows, each with a photo and text.",
        fields: [
          text("title", "Heading"),
          text("titleAccent", "Highlighted word(s)", "Shown in yellow italics."),
          {
            key: "milestones",
            label: "Milestones",
            kind: "list",
            itemLabel: "milestone",
            itemFields: [text("year", "Years"), text("title", "Title"), img("image", "Photo"), text("imageAlt", "Photo description (alt text)"), rich("body", "Text")],
          },
        ],
      },
    ],
  },
  {
    key: "team",
    title: "Our Team",
    description: "Banner, intro text and headings of the Our Team page. The team members are managed under Team in the sidebar.",
    path: "/company/team",
    sections: [
      SEO,
      {
        key: "hero",
        title: "Top banner",
        description: "Heading, subtitle and photo at the top of the page.",
        fields: [text("title", "Heading"), area("subtitle", "Subtitle"), img("image", "Photo"), text("imageAlt", "Photo description (alt text)")],
      },
      {
        key: "intro",
        title: "Intro",
        description: "Label, heading, text and photo beside it.",
        fields: [
          text("label", "Small label"),
          text("heading", "Heading"),
          text("headingAccent", "Highlighted word(s)", "Shown in yellow italics."),
          rich("body", "Intro text"),
          img("image", "Photo"),
          text("imageAlt", "Photo description (alt text)"),
        ],
      },
      {
        key: "grid",
        title: "Team grid heading",
        description: "Heading above the team members.",
        fields: [text("heading", "Start of heading"), text("headingAccent", "Highlighted word(s)", "Shown in yellow italics."), text("headingEnd", "End of heading")],
      },
    ],
  },
  {
    key: "legal",
    title: "Legal Documents",
    description: "Statement text and group headings. The scanned certificates are managed under Company Documents in the sidebar.",
    path: "/company/legal-documents",
    sections: [
      SEO,
      {
        key: "intro",
        title: "Heading & statement",
        description: "Page heading, the registration statement and the highlighted note.",
        fields: [text("title", "Page heading"), rich("body", "Registration statement"), area("note", "Highlighted note")],
      },
      {
        key: "groups",
        title: "Document group headings",
        description: "Headings above the two groups of certificates.",
        fields: [text("legalTitle", "First group heading"), text("associationsTitle", "Second group heading")],
      },
    ],
  },
  {
    key: "plan",
    title: "Plan Your Trip",
    description: "Heading, introduction text (text editor) and form headings of the Plan Your Nepal Trip page.",
    path: "/plan-your-trip",
    sections: [
      SEO,
      {
        key: "content",
        title: "Heading & introduction",
        description: "Page heading and the intro text above the form, written in the text editor.",
        fields: [text("title", "Page heading"), rich("body", "Introduction text")],
      },
      {
        key: "form",
        title: "Form text",
        description: "Section headings of the form, the button text and the message shown after sending.",
        fields: [text("personalTitle", "First section heading"), text("tripTitle", "Second section heading"), text("submitLabel", "Submit button text"), area("successMessage", "Success message")],
      },
    ],
  },
  {
    key: "wishlist",
    title: "Wishlist",
    description: "Heading and the “No saved trips yet” message of the Wishlist page.",
    path: "/wishlist",
    sections: [
      {
        key: "content",
        title: "Heading & empty message",
        description: "The page heading and what visitors see before they have saved any trip.",
        fields: [
          text("title", "Page heading"),
          text("emptyTitle", "Empty-wishlist title"),
          text("emptyText", "Empty-wishlist text"),
          text("buttonLabel", "Link text"),
          link("buttonHref", "Link address"),
        ],
      },
    ],
  },
  proseDef("guided", "Why Guided Travel?", "/company/why-guided-travel", true),
  proseDef("responsible", "Responsible Travel", "/company/responsible-travel", true),
  proseDef("partner", "Partner with Us", "/company/partner-with-us", false, "The partner enquiry form below the text isn't editable here."),
  proseDef("terms", "Terms and Conditions", "/company/terms-and-conditions", false),
  proseDef("privacy", "Privacy Policy", "/company/privacy-policy", false),
  {
    key: "footer",
    title: "Footer",
    description: "The footer shown on every page: newsletter, headings, tagline, payments and legal line.",
    path: "/",
    sections: [
      {
        key: "newsletter",
        title: "Newsletter",
        description: "The “Get travel deals” box at the top of the footer.",
        fields: [
          text("title", "Title"),
          area("text", "Text"),
          text("namePlaceholder", "Name field placeholder"),
          text("emailPlaceholder", "Email field placeholder"),
          text("buttonLabel", "Button text"),
        ],
      },
      {
        key: "columns",
        title: "Link column headings",
        description: "Headings above the link lists. The links themselves are edited under Menus.",
        fields: [text("companyHeading", "Company column heading"), text("usefulLinksHeading", "Useful Links heading")],
      },
      {
        key: "brand",
        title: "Brand & background",
        description: "Tagline under the logo, opening hours line, big faded name and background photo. Address, phone and email come from Global Settings.",
        fields: [
          text("tagline", "Tagline under the logo"),
          text("openingHours", "Opening hours line"),
          text("watermark", "Big faded brand name", "Leave empty to use the company name."),
          { key: "backgroundImage", label: "Background photo", kind: "image" },
        ],
      },
      {
        key: "social",
        title: "Social links",
        description: "Heading of the social icons. The profile URLs are edited in Global Settings.",
        fields: [text("heading", "Heading")],
      },
      {
        key: "payments",
        title: "Payments",
        description: "The “We accept” payment methods strip.",
        fields: [
          text("heading", "Heading"),
          { key: "image", label: "Payment methods image", kind: "image" },
          text("imageAlt", "Image description (alt text)"),
          link("href", "Link"),
        ],
      },
      {
        key: "legal",
        title: "Legal line",
        description: "Copyright wording, developer credit and registration numbers.",
        fields: [
          text("rightsText", "Rights text", "Shown after “© year company name.”"),
          text("developedByLabel", "Developer credit label"),
          text("developerName", "Developer name"),
          link("developerUrl", "Developer link"),
          text("registration", "Registration numbers"),
        ],
      },
    ],
  },
];

/** Pages shown together under one card on the Page Content screen. */
export interface PageGroup {
  key: string;
  title: string;
  description: string;
  /** Keys of the PAGE_DEFS entries inside this group, in display order. */
  pages: string[];
}

export const PAGE_GROUPS: PageGroup[] = [
  {
    key: "company",
    title: "Company",
    description: "Pages in the website's Company menu: About Us, Our Team, Legal Documents, Why Guided Travel, Responsible Travel, Partner with Us, Affiliate Program, Terms and Privacy.",
    pages: ["about", "team", "legal", "guided", "responsible", "partner", "affiliate", "terms", "privacy"],
  },
];

export const getPageGroup = (key: string) => PAGE_GROUPS.find((g) => g.key === key);
export const getGroupOfPage = (pageKey: string) => PAGE_GROUPS.find((g) => g.pages.includes(pageKey));

export const getPageDef = (key: string) => PAGE_DEFS.find((p) => p.key === key);
