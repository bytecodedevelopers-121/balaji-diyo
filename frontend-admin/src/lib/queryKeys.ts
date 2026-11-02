export const queryKeys = {
  // auth
  me: ["me"] as const,

  // users
  users: {
    all: ["users"] as const,
    list: (params?: object) => ["users", "list", params] as const,
    detail: (id: string) => ["users", id] as const,
  },

  // roles
  roles: {
    all: ["roles"] as const,
    list: (params?: object) => ["roles", "list", params] as const,
    detail: (id: string) => ["roles", id] as const,
  },

  // permissions
  permissions: {
    all: ["permissions"] as const,
  },

  // pages
  pages: {
    all: ["pages"] as const,
    list: (params?: object) => ["pages", "list", params] as const,
    adminList: (params?: object) => ["pages", "admin-list", params] as const,
    detail: (id: string) => ["pages", id] as const,
  },

  // category types
  categoryTypes: {
    all: ["category-types"] as const,
    list: (params?: object) => ["category-types", "list", params] as const,
    detail: (id: string) => ["category-types", id] as const,
  },

  // categories
  categories: {
    all: ["categories"] as const,
    list: (params?: object) => ["categories", "list", params] as const,
    detail: (id: string) => ["categories", id] as const,
    tree: (typeId: string) => ["categories", "tree", typeId] as const,
  },

  // tags
  tags: {
    all: ["tags"] as const,
    list: (params?: object) => ["tags", "list", params] as const,
    detail: (id: string) => ["tags", id] as const,
  },

  // blog authors
  blogAuthors: {
    all: ["blog-authors"] as const,
    list: (params?: object) => ["blog-authors", "list", params] as const,
    detail: (id: string) => ["blog-authors", id] as const,
  },

  // blogs
  blogs: {
    all: ["blogs"] as const,
    list: (params?: object) => ["blogs", "list", params] as const,
    adminList: (params?: object) => ["blogs", "admin-list", params] as const,
    detail: (id: string) => ["blogs", id] as const,
  },

  // blog comments
  blogComments: {
    all: ["blog-comments"] as const,
    list: (params?: object) => ["blog-comments", "list", params] as const,
  },

  // faqs
  faqs: {
    all: ["faqs"] as const,
    list: (params?: object) => ["faqs", "list", params] as const,
  },

  // group faqs
  groupFaqs: {
    all: ["group-faqs"] as const,
    list: (params?: object) => ["group-faqs", "list", params] as const,
  },

  // places
  places: {
    all: ["places"] as const,
    list: (params?: object) => ["places", "list", params] as const,
    detail: (id: string) => ["places", id] as const,
  },

  // gallery albums
  galleryAlbums: {
    all: ["gallery-albums"] as const,
    list: (params?: object) => ["gallery-albums", "list", params] as const,
    detail: (id: string) => ["gallery-albums", id] as const,
  },

  // team members
  teamMembers: {
    all: ["team-members"] as const,
    list: (params?: object) => ["team-members", "list", params] as const,
    detail: (id: string) => ["team-members", id] as const,
  },

  // cost (include/exclude) categories
  costCategories: {
    all: ["cost-categories"] as const,
    list: (params?: object) => ["cost-categories", "list", params] as const,
  },

  // company documents
  companyDocuments: {
    all: ["company-documents"] as const,
    list: (params?: object) => ["company-documents", "list", params] as const,
    detail: (id: string) => ["company-documents", id] as const,
  },

  // homepage services
  services: {
    all: ["services"] as const,
    config: ["services", "section-config"] as const,
    list: (params?: object) => ["services", "list", params] as const,
    detail: (id: string) => ["services", id] as const,
  },

  // testimonials
  testimonials: {
    all: ["testimonials"] as const,
    list: (params?: object) => ["testimonials", "list", params] as const,
    detail: (id: string) => ["testimonials", id] as const,
  },

  // trip infos
  tripInfos: {
    all: ["trip-infos"] as const,
    list: (params?: object) => ["trip-infos", "list", params] as const,
  },

  // story authors
  storyAuthors: {
    all: ["story-authors"] as const,
    list: (params?: object) => ["story-authors", "list", params] as const,
  },

  // stories
  stories: {
    all: ["stories"] as const,
    list: (params?: object) => ["stories", "list", params] as const,
    adminList: (params?: object) => ["stories", "admin-list", params] as const,
    detail: (id: string) => ["stories", id] as const,
  },

  // packages
  packages: {
    all: ["packages"] as const,
    list: (params?: object) => ["packages", "list", params] as const,
    detail: (id: string) => ["packages", id] as const,
  },

  // departures (always packageId-scoped)
  departures: {
    all: ["departures"] as const,
    list: (packageId: string) => ["departures", "list", packageId] as const,
  },

  // itinerary (one per package)
  itinerary: {
    all: ["itinerary"] as const,
    byPackage: (packageId: string) => ["itinerary", "by-package", packageId] as const,
  },

  // package maps ("Trip Map")
  packageMaps: {
    all: ["package-maps"] as const,
    listAll: (params?: object) => ["package-maps", "list-all", params] as const,
    detail: (id: string) => ["package-maps", id] as const,
  },

  // contacts
  contacts: {
    all: ["contacts"] as const,
    adminList: (params?: object) => ["contacts", "admin-list", params] as const,
  },

  // media
  media: {
    all: ["media"] as const,
    list: (params?: object) => ["media", "list", params] as const,
    detail: (id: string) => ["media", id] as const,
  },

  // attachments (media linked to an owner entity, e.g. package featured image)
  attachments: {
    all: ["attachments"] as const,
    byOwner: (ownerType: string, ownerId: string | undefined, role?: string) =>
      ["attachments", ownerType, ownerId, role] as const,
  },

  // analytics
  analytics: {
    dashboard: (range: string) => ["analytics", "dashboard", range] as const,
  },

  // files (signed URLs for the private storage bucket)
  files: {
    signedUrl: (path: string | null | undefined) => ["signed-url", path] as const,
    signedUrls: (paths: (string | null | undefined)[]) => ["signed-urls", paths] as const,
  },

  // bookings
  bookings: {
    all: ["bookings"] as const,
    list: (params?: object) => ["bookings", "list", params] as const,
    detail: (id: string) => ["bookings", id] as const,
  },

  // custom bookings
  customBookings: {
    all: ["custom-bookings"] as const,
    list: (params?: object) => ["custom-bookings", "list", params] as const,
    detail: (id: string) => ["custom-bookings", id] as const,
  },

  // payments
  payments: {
    all: ["payments"] as const,
    list: (params?: object) => ["payments", "list", params] as const,
    detail: (id: string) => ["payments", id] as const,
  },

  // menu types
  menuTypes: {
    all: ["menu-types"] as const,
    list: (params?: object) => ["menu-types", "list", params] as const,
    detail: (id: string) => ["menu-types", id] as const,
  },

  // menu items (always typeId-scoped via the tree endpoint)
  menuItems: {
    all: ["menu-items"] as const,
    tree: (typeId: string) => ["menu-items", "tree", typeId] as const,
  },

  // global settings
  globalSettings: {
    all: ["global-settings"] as const,
    list: (params?: object) => ["global-settings", "list", params] as const,
    detail: (id: string) => ["global-settings", id] as const,
  },

  // global categories (settings groupings)
  globalCategories: {
    all: ["global-categories"] as const,
    list: (params?: object) => ["global-categories", "list", params] as const,
  },

  // redirects
  redirects: {
    all: ["redirects"] as const,
    list: (params?: object) => ["redirects", "list", params] as const,
    detail: (id: string) => ["redirects", id] as const,
  },

  // activity logs (read-only)
  activityLogs: {
    all: ["activity-logs"] as const,
    list: (params?: object) => ["activity-logs", "list", params] as const,
    detail: (id: string) => ["activity-logs", id] as const,
  },
};
