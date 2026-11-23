export const PATHS = {
  HOME: "/",
  LOGIN: "/login",
  FORBIDDEN: "/403",
  NOT_FOUND: "/404",

  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  CHANGE_PASSWORD: "/change-password",

  USERS: "/users",
  USER_CREATE: "/users/create",
  USER_DETAIL: (id: string) => `/users/${id}`,

  ROLES: "/roles",
  ROLE_CREATE: "/roles/create",
  ROLE_DETAIL: (id: string) => `/roles/${id}`,

  PAGES: "/pages",
  PAGE_CREATE: "/pages/create",
  PAGE_DETAIL: (id: string) => `/pages/${id}`,

  CATEGORY_TYPES: "/category-types",
  CATEGORIES: "/categories",
  TAGS: "/tags",

  BLOG_AUTHORS: "/blog-authors",
  BLOGS: "/blogs",
  BLOG_CREATE: "/blogs/create",
  BLOG_DETAIL: (id: string) => `/blogs/${id}`,
  BLOG_COMMENTS: "/blog-comments",

  CONTACTS: "/contacts",
  INQUIRIES: "/inquiries",
  MEDIA: "/media",

  FAQS: "/faqs",
  GROUP_FAQS: "/group-faqs",

  PLACES: "/places",
  PLACE_CREATE: "/places/create",
  PLACE_DETAIL: (id: string) => `/places/${id}`,

  GALLERY_ALBUMS: "/gallery-albums",
  GALLERY_ALBUM_CREATE: "/gallery-albums/create",
  GALLERY_ALBUM_DETAIL: (id: string) => `/gallery-albums/${id}`,

  TEAM_MEMBERS: "/team-members",
  TEAM_MEMBER_CREATE: "/team-members/create",
  TEAM_MEMBER_DETAIL: (id: string) => `/team-members/${id}`,

  COST_CATEGORIES: "/cost-categories",
  COMPANY_DOCUMENTS: "/company-documents",
  COMPANY_DOCUMENT_CREATE: "/company-documents/create",
  COMPANY_DOCUMENT_DETAIL: (id: string) => `/company-documents/${id}`,

  SERVICES: "/services",
  SERVICE_CREATE: "/services/create",
  SERVICE_DETAIL: (id: string) => `/services/${id}`,

  TESTIMONIALS: "/testimonials",
  TESTIMONIAL_CREATE: "/testimonials/create",
  TESTIMONIAL_DETAIL: (id: string) => `/testimonials/${id}`,

  TRIP_INFOS: "/trip-infos",
  STORY_AUTHORS: "/story-authors",
  STORIES: "/stories",
  STORY_CREATE: "/stories/create",
  STORY_DETAIL: (id: string) => `/stories/${id}`,
  DESTINATIONS: "/destinations",
  TRAVEL_GUIDES: "/travel-guides",
  WEB_STORIES: "/web-stories",
  TOUR_TYPES: "/tour-types",
  REGIONS: "/regions",

  PACKAGES: "/packages",
  PACKAGE_CREATE: "/packages/create",
  LAST_MINUTE_DEALS: "/last-minute-deals",
  PACKAGE_DETAIL: (id: string) => `/packages/${id}`,
  TRIP_MAPS: "/trip-maps",
  TRIP_MAP_CREATE: "/trip-maps/create",
  TRIP_MAP_DETAIL: (id: string) => `/trip-maps/${id}`,

  BOOKINGS: "/bookings",
  CUSTOM_BOOKINGS: "/custom-bookings",
  PAYMENTS: "/payments",

  MENU_TYPES: "/menu-types",
  MENU_ITEMS: (typeId: string) => `/menu-items/${typeId}`,

  PAGE_CONTENT: "/page-content",
  PAGE_CONTENT_GROUP: (groupKey: string) => `/page-content/group/${groupKey}`,
  PAGE_CONTENT_EDIT: (pageKey: string) => `/page-content/${pageKey}`,

  GLOBAL_SETTINGS: "/global-settings",
  REDIRECTS: "/redirects",
  ACTIVITY_LOG: "/activity-log",

  // B2B — internal admin console
  B2B_PARTNERS: "/b2b/partners",
  B2B_PARTNER_DETAIL: (id: string) => `/b2b/partners/${id}`,
  B2B_TIERS: "/b2b/tiers",
  B2B_CONTRACTS: "/b2b/contracts",
  B2B_ALLOTMENTS: "/b2b/allotments",
  B2B_BOOKINGS: "/b2b/bookings",
  B2B_SLA: "/b2b/sla",
  B2B_SETTLEMENTS: "/b2b/settlements",

  // B2B — partner (agency) portal
  PARTNER_REGISTER: "/partner/register",
  PARTNER_HOME: "/partner",
  PARTNER_TEAM: "/partner/team",
  PARTNER_CATALOG: "/partner/catalog",
  PARTNER_PACKAGE: (id: string) => `/partner/catalog/${id}`,
  PARTNER_HOLDS: "/partner/holds",
  PARTNER_CHECKOUT: "/partner/checkout",
  PARTNER_BOOKINGS: "/partner/bookings",
  PARTNER_BOOKING: (id: string) => `/partner/bookings/${id}`,
  PARTNER_WALLET: "/partner/wallet",
  PARTNER_SETTLEMENTS: "/partner/settlements",
  PARTNER_DEVELOPER: "/partner/developer",
  PARTNER_TICKETS: "/partner/tickets",
} as const;
