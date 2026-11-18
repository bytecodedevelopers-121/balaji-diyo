// src/components/common/layout/Sidebar/navConfig.ts
import {
  LayoutDashboard,
  Newspaper,
  FileText,
  FolderTree,
  Tags,
  Mail,
  Image,
  Users2,
  ShieldCheck,
  UserCog,
  Lock,
  HelpCircle,
  MapPin,
  Images,
  Contact,
  FileCheck,
  // ConciergeBell, // needed again when the Services menu is restored
  Quote,
  Plane,
  Timer,
  CalendarCheck,
  CreditCard,
  ListTree,
  Settings,
  LayoutTemplate,
  Link2,
  History,
  type LucideIcon,
} from "lucide-react";
import { PATHS } from "@/constants/PATHS";
import { INQUIRY_TYPES } from "@/constants/inquiryTypes";

export type NavSection = "main" | "system";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Permission required to see this item. Omit (or null) to show to all authenticated users — superAdmin always bypasses this check. */
  permission?: string | null;
  /** Groups the item under a labeled section in the sidebar. Defaults to "main". */
  section?: NavSection;
  /** Match the path exactly, so a parent-style link isn't highlighted on its sub-routes. */
  end?: boolean;
  children?: Omit<NavItem, "icon" | "children">[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    path: PATHS.DASHBOARD,
    icon: LayoutDashboard,
    permission: null,
    section: "main",
  },
  {
    label: "Blogs",
    path: PATHS.BLOGS,
    icon: Newspaper,
    permission: "read:blog",
    section: "main",
    children: [
      { label: "All Blogs", path: PATHS.BLOGS, permission: "read:blog" },
      { label: "Create Blog", path: PATHS.BLOG_CREATE, permission: "create:blog" },
      { label: "Blog Authors", path: PATHS.BLOG_AUTHORS, permission: "read:blog" },
    ],
  },
  {
    label: "Pages",
    path: PATHS.PAGES,
    icon: FileText,
    permission: "read:page",
    section: "main",
    children: [
      { label: "All Pages", path: PATHS.PAGES, permission: "read:page" },
      { label: "Create Page", path: PATHS.PAGE_CREATE, permission: "create:page" },
    ],
  },
  {
    label: "Page Content",
    path: PATHS.PAGE_CONTENT,
    icon: LayoutTemplate,
    permission: "read:settings",
    section: "main",
  },
  {
    label: "Categories",
    path: PATHS.CATEGORIES,
    icon: FolderTree,
    permission: "read:category",
    section: "main",
    children: [
      { label: "Categories", path: PATHS.CATEGORIES, permission: "read:category" },
      { label: "Category Types", path: PATHS.CATEGORY_TYPES, permission: "read:category" },
    ],
  },
  {
    label: "Tags",
    path: PATHS.TAGS,
    icon: Tags,
    permission: "read:tag",
    section: "main",
  },
  {
    label: "Inquiries",
    path: PATHS.INQUIRIES,
    icon: Mail,
    permission: "read:contact",
    section: "main",
    children: [
      { label: "All Inquiries", path: PATHS.INQUIRIES, permission: "read:contact", end: true },
      ...INQUIRY_TYPES.map((t) => ({ label: t.label, path: `${PATHS.INQUIRIES}/${t.slug}`, permission: "read:contact" })),
    ],
  },
  {
    label: "FAQs",
    path: PATHS.FAQS,
    icon: HelpCircle,
    permission: "read:faq",
    section: "main",
    children: [
      { label: "FAQs", path: PATHS.FAQS, permission: "read:faq" },
      { label: "Group FAQs", path: PATHS.GROUP_FAQS, permission: "read:faq" },
    ],
  },
  {
    label: "Places",
    path: PATHS.PLACES,
    icon: MapPin,
    permission: "read:place",
    section: "main",
    children: [
      { label: "All Places", path: PATHS.PLACES, permission: "read:place" },
      { label: "Add Place", path: PATHS.PLACE_CREATE, permission: "create:place" },
    ],
  },
  {
    label: "Gallery",
    path: PATHS.GALLERY_ALBUMS,
    icon: Images,
    permission: "read:gallery",
    section: "main",
    children: [
      { label: "All Albums", path: PATHS.GALLERY_ALBUMS, permission: "read:gallery" },
      { label: "Add Album", path: PATHS.GALLERY_ALBUM_CREATE, permission: "create:gallery" },
    ],
  },
  {
    label: "Team",
    path: PATHS.TEAM_MEMBERS,
    icon: Contact,
    permission: "read:team",
    section: "main",
    children: [
      { label: "All Members", path: PATHS.TEAM_MEMBERS, permission: "read:team" },
      { label: "Add Member", path: PATHS.TEAM_MEMBER_CREATE, permission: "create:team" },
    ],
  },
  {
    label: "Company Documents",
    path: PATHS.COMPANY_DOCUMENTS,
    icon: FileCheck,
    permission: "read:document",
    section: "main",
    children: [
      { label: "All Documents", path: PATHS.COMPANY_DOCUMENTS, permission: "read:document" },
      { label: "Add Document", path: PATHS.COMPANY_DOCUMENT_CREATE, permission: "create:document" },
    ],
  },
  // Services menu hidden for now — uncomment this block (and the ConciergeBell import) to restore.
  // {
  //   label: "Services",
  //   path: PATHS.SERVICES,
  //   icon: ConciergeBell,
  //   permission: "read:service",
  //   section: "main",
  //   children: [
  //     { label: "All Services", path: PATHS.SERVICES, permission: "read:service" },
  //     { label: "Add Service", path: PATHS.SERVICE_CREATE, permission: "create:service" },
  //   ],
  // },
  {
    label: "Testimonials",
    path: PATHS.TESTIMONIALS,
    icon: Quote,
    permission: "read:testimonial",
    section: "main",
    children: [
      { label: "All Testimonials", path: PATHS.TESTIMONIALS, permission: "read:testimonial" },
      { label: "Add Testimonial", path: PATHS.TESTIMONIAL_CREATE, permission: "create:testimonial" },
    ],
  },
  {
    label: "Travel",
    path: PATHS.PACKAGES,
    icon: Plane,
    permission: "read:travel",
    section: "main",
    children: [
      { label: "All Packages", path: PATHS.PACKAGES, permission: "read:travel" },
      { label: "Create Package", path: PATHS.PACKAGE_CREATE, permission: "create:travel" },
      { label: "Trip Maps", path: PATHS.TRIP_MAPS, permission: "read:travel" },
      { label: "Trip Info", path: PATHS.TRIP_INFOS, permission: "read:travel" },
      { label: "Include / Exclude", path: PATHS.COST_CATEGORIES, permission: "read:travel" },
      // Hidden for now — uncomment to show Stories again in the sidebar.
      // { label: "Stories", path: PATHS.STORIES, permission: "read:travel" },
      // { label: "Create Story", path: PATHS.STORY_CREATE, permission: "create:travel" },
      // { label: "Story Authors", path: PATHS.STORY_AUTHORS, permission: "read:travel" },
      { label: "Tour Types", path: PATHS.TOUR_TYPES, permission: "read:travel" },
      { label: "Regions", path: PATHS.REGIONS, permission: "read:travel" },
      { label: "Destinations", path: PATHS.DESTINATIONS, permission: "read:travel" },
      { label: "Travel Guides", path: PATHS.TRAVEL_GUIDES, permission: "read:travel" },
      { label: "Web Stories", path: PATHS.WEB_STORIES, permission: "read:travel" },
    ],
  },
  {
    label: "Last Minute Deals",
    path: PATHS.LAST_MINUTE_DEALS,
    icon: Timer,
    permission: "read:travel",
    section: "main",
  },
  {
    label: "Bookings",
    path: PATHS.BOOKINGS,
    icon: CalendarCheck,
    permission: "read:booking",
    section: "main",
    children: [
      { label: "All Bookings", path: PATHS.BOOKINGS, permission: "read:booking" },
      { label: "Custom Bookings", path: PATHS.CUSTOM_BOOKINGS, permission: "read:booking" },
    ],
  },
  {
    label: "Payments",
    path: PATHS.PAYMENTS,
    icon: CreditCard,
    permission: "read:payment",
    section: "main",
  },
  {
    label: "Media Library",
    path: PATHS.MEDIA,
    icon: Image,
    permission: "read:media",
    section: "main",
  },
  {
    label: "Menus",
    path: PATHS.MENU_TYPES,
    icon: ListTree,
    permission: "read:menu",
    section: "main",
  },
  {
    label: "Global Settings",
    path: PATHS.GLOBAL_SETTINGS,
    icon: Settings,
    permission: "read:settings",
    section: "system",
  },
  {
    label: "Redirects",
    path: PATHS.REDIRECTS,
    icon: Link2,
    permission: "read:redirect",
    section: "system",
  },
  {
    label: "Activity Log",
    path: PATHS.ACTIVITY_LOG,
    icon: History,
    permission: "read:activity-log",
    section: "system",
  },
  {
    label: "Users",
    path: PATHS.USERS,
    icon: Users2,
    permission: "read:user",
    section: "system",
    children: [
      { label: "User List", path: PATHS.USERS, permission: "read:user" },
      { label: "Create User", path: PATHS.USER_CREATE, permission: "create:user" },
    ],
  },
  {
    label: "Roles",
    path: PATHS.ROLES,
    icon: ShieldCheck,
    permission: "read:role",
    section: "system",
    children: [
      { label: "View Roles", path: PATHS.ROLES, permission: "read:role" },
      { label: "Create Role", path: PATHS.ROLE_CREATE, permission: "create:role" },
    ],
  },

  // ── Shared account items ────────────────────────────────────────────────
  {
    label: "Profile Management",
    path: PATHS.PROFILE,
    icon: UserCog,
    section: "system",
  },
  {
    label: "Change Password",
    path: PATHS.CHANGE_PASSWORD,
    icon: Lock,
    section: "system",
  },
];
