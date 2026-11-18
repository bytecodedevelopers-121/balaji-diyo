/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { PATHS } from "@/constants/PATHS";
import { FullPageSpinner } from "@/components/ui/FullPageSpinner";
import { PrivateRoute } from "@/components/guards/PrivateRoute";
import { PublicRoute } from "@/components/guards/PublicRoute";
import { PermissionRoute } from "@/components/guards/PermissionRoute";
import AppLayout from "@/components/layouts/AppLayout";
import { DashboardLayout } from "@/components/common/layout";

const LoginPage = lazy(() => import("@/pages/auth/LoginPage"));
const ForbiddenPage = lazy(() => import("@/pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));
const ChangePasswordPage = lazy(() => import("@/pages/profile/ChangePasswordPage"));
const UsersPage = lazy(() => import("@/pages/admin/users/UsersPage"));
const CreateUserPage = lazy(() => import("@/pages/admin/users/CreateUserPage"));
const UserDetailPage = lazy(() => import("@/pages/admin/users/UserDetailPage"));
const RolesPage = lazy(() => import("@/pages/admin/roles/RolesPage"));
const CreateRolePage = lazy(() => import("@/pages/admin/roles/CreateRolePage"));
const RoleDetailPage = lazy(() => import("@/pages/admin/roles/RoleDetailPage"));

const PagesListPage = lazy(() => import("@/pages/content/pages/PagesPage"));
const CreatePagePage = lazy(() => import("@/pages/content/pages/CreatePagePage"));
const PageDetailPage = lazy(() => import("@/pages/content/pages/PageDetailPage"));
const CategoryTypesPage = lazy(() => import("@/pages/content/category-types/CategoryTypesPage"));
const CategoriesPage = lazy(() => import("@/pages/content/categories/CategoriesPage"));
const TagsPage = lazy(() => import("@/pages/content/tags/TagsPage"));
const BlogAuthorsPage = lazy(() => import("@/pages/content/blog-authors/BlogAuthorsPage"));
const BlogsPage = lazy(() => import("@/pages/content/blogs/BlogsPage"));
const CreateBlogPage = lazy(() => import("@/pages/content/blogs/CreateBlogPage"));
const BlogDetailPage = lazy(() => import("@/pages/content/blogs/BlogDetailPage"));
const ContactsPage = lazy(() => import("@/pages/content/contacts/ContactsPage"));
const MediaLibraryPage = lazy(() => import("@/pages/content/media/MediaLibraryPage"));
const FaqsPage = lazy(() => import("@/pages/content/faqs/FaqsPage"));
const GroupFaqsPage = lazy(() => import("@/pages/content/group-faqs/GroupFaqsPage"));
const PlacesPage = lazy(() => import("@/pages/content/places/PlacesPage"));
const CreatePlacePage = lazy(() => import("@/pages/content/places/CreatePlacePage"));
const PlaceDetailPage = lazy(() => import("@/pages/content/places/PlaceDetailPage"));
const GalleryAlbumsPage = lazy(() => import("@/pages/content/gallery-albums/GalleryAlbumsPage"));
const CreateGalleryAlbumPage = lazy(() => import("@/pages/content/gallery-albums/CreateGalleryAlbumPage"));
const GalleryAlbumDetailPage = lazy(() => import("@/pages/content/gallery-albums/GalleryAlbumDetailPage"));
const TeamMembersPage = lazy(() => import("@/pages/content/team-members/TeamMembersPage"));
const CreateTeamMemberPage = lazy(() => import("@/pages/content/team-members/CreateTeamMemberPage"));
const TeamMemberDetailPage = lazy(() => import("@/pages/content/team-members/TeamMemberDetailPage"));
const CostCategoriesPage = lazy(() => import("@/pages/content/cost-categories/CostCategoriesPage"));
const CompanyDocumentsPage = lazy(() => import("@/pages/content/company-documents/CompanyDocumentsPage"));
const CreateCompanyDocumentPage = lazy(() => import("@/pages/content/company-documents/CreateCompanyDocumentPage"));
const CompanyDocumentDetailPage = lazy(() => import("@/pages/content/company-documents/CompanyDocumentDetailPage"));
const ServicesPage = lazy(() => import("@/pages/content/services/ServicesPage"));
const CreateServicePage = lazy(() => import("@/pages/content/services/CreateServicePage"));
const ServiceDetailPage = lazy(() => import("@/pages/content/services/ServiceDetailPage"));
const TestimonialsPage = lazy(() => import("@/pages/content/testimonials/TestimonialsPage"));
const CreateTestimonialPage = lazy(() => import("@/pages/content/testimonials/CreateTestimonialPage"));
const TestimonialDetailPage = lazy(() => import("@/pages/content/testimonials/TestimonialDetailPage"));
const TripInfosPage = lazy(() => import("@/pages/content/trip-infos/TripInfosPage"));
const StoryAuthorsPage = lazy(() => import("@/pages/content/story-authors/StoryAuthorsPage"));
const StoriesPage = lazy(() => import("@/pages/content/stories/StoriesPage"));
const DestinationsAdminPage = lazy(() => import("@/pages/content/site-content/SiteContentPage").then((m) => ({ default: m.DestinationsAdminPage })));
const TravelGuidesAdminPage = lazy(() => import("@/pages/content/site-content/SiteContentPage").then((m) => ({ default: m.TravelGuidesAdminPage })));
const TourTypesAdminPage = lazy(() => import("@/pages/content/tour-types/TourTypesPage").then((m) => ({ default: m.TourTypesAdminPage })));
const RegionsAdminPage = lazy(() => import("@/pages/content/tour-types/TourTypesPage").then((m) => ({ default: m.RegionsAdminPage })));
const WebStoriesAdminPage = lazy(() => import("@/pages/content/site-content/SiteContentPage").then((m) => ({ default: m.WebStoriesAdminPage })));
const CreateStoryPage = lazy(() => import("@/pages/content/stories/CreateStoryPage"));
const StoryDetailPage = lazy(() => import("@/pages/content/stories/StoryDetailPage"));
const LastMinuteDealsPage = lazy(() => import("@/pages/content/last-minute/LastMinuteDealsPage"));
const PackagesPage = lazy(() => import("@/pages/content/packages/PackagesPage"));
const TripMapsPage = lazy(() => import("@/pages/content/trip-maps/TripMapsPage"));
const CreateTripMapPage = lazy(() => import("@/pages/content/trip-maps/CreateTripMapPage"));
const TripMapDetailPage = lazy(() => import("@/pages/content/trip-maps/TripMapDetailPage"));
const CreatePackagePage = lazy(() => import("@/pages/content/packages/CreatePackagePage"));
const PackageDetailPage = lazy(() => import("@/pages/content/packages/PackageDetailPage"));
const BookingsPage = lazy(() => import("@/pages/content/bookings/BookingsPage"));
const CustomBookingsPage = lazy(() => import("@/pages/content/custom-bookings/CustomBookingsPage"));
const PaymentsPage = lazy(() => import("@/pages/content/payments/PaymentsPage"));
const MenuTypesPage = lazy(() => import("@/pages/content/menu-types/MenuTypesPage"));
const MenuItemsPage = lazy(() => import("@/pages/content/menu-items/MenuItemsPage"));
const GlobalSettingsPage = lazy(() => import("@/pages/content/global-settings/GlobalSettingsPage"));
const RedirectsPage = lazy(() => import("@/pages/content/redirects/RedirectsPage"));
const ActivityLogsPage = lazy(() => import("@/pages/content/activity-logs/ActivityLogsPage"));

// add more as you build them

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<FullPageSpinner />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        element: <PublicRoute />,
        children: [{ path: PATHS.LOGIN, element: withSuspense(<LoginPage />) }],
      },
      {
        element: <PrivateRoute />,
        children: [
          { path: PATHS.HOME, element: <Navigate to={PATHS.DASHBOARD} replace /> },
          {
            element: <DashboardLayout />,
            children: [
              { path: "profile", element: withSuspense(<ProfilePage />) },
              { path: "change-password", element: withSuspense(<ChangePasswordPage />) },
              // No permission needed — any authenticated user
              { path: "dashboard", element: withSuspense(<DashboardPage />) },
              { path: "roles", element: withSuspense(<RolesPage />) },
              { path: "roles/create", element: withSuspense(<CreateRolePage />) },
              { path: "roles/:id", element: withSuspense(<RoleDetailPage />) },

              {
                element: <PermissionRoute permission="read:user" />,
                children: [
                  { path: "users", element: withSuspense(<UsersPage />) },
                  { path: "users/:id", element: withSuspense(<UserDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:user" />,
                children: [{ path: "users/create", element: withSuspense(<CreateUserPage />) }],
              },

              {
                element: <PermissionRoute permission="read:page" />,
                children: [
                  { path: "pages", element: withSuspense(<PagesListPage />) },
                  { path: "pages/:id", element: withSuspense(<PageDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:page" />,
                children: [{ path: "pages/create", element: withSuspense(<CreatePagePage />) }],
              },

              {
                element: <PermissionRoute permission="read:category" />,
                children: [
                  { path: "category-types", element: withSuspense(<CategoryTypesPage />) },
                  { path: "categories", element: withSuspense(<CategoriesPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="read:tag" />,
                children: [{ path: "tags", element: withSuspense(<TagsPage />) }],
              },

              {
                element: <PermissionRoute permission="read:blog" />,
                children: [
                  { path: "blog-authors", element: withSuspense(<BlogAuthorsPage />) },
                  { path: "blogs", element: withSuspense(<BlogsPage />) },
                  { path: "blogs/:id", element: withSuspense(<BlogDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:blog" />,
                children: [{ path: "blogs/create", element: withSuspense(<CreateBlogPage />) }],
              },
              {
                element: <PermissionRoute permission="read:contact" />,
                children: [{ path: "contacts", element: withSuspense(<ContactsPage />) }],
              },
              {
                element: <PermissionRoute permission="read:media" />,
                children: [{ path: "media", element: withSuspense(<MediaLibraryPage />) }],
              },

              {
                element: <PermissionRoute permission="read:faq" />,
                children: [
                  { path: "faqs", element: withSuspense(<FaqsPage />) },
                  { path: "group-faqs", element: withSuspense(<GroupFaqsPage />) },
                ],
              },

              {
                element: <PermissionRoute permission="read:place" />,
                children: [
                  { path: "places", element: withSuspense(<PlacesPage />) },
                  { path: "places/:id", element: withSuspense(<PlaceDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:place" />,
                children: [{ path: "places/create", element: withSuspense(<CreatePlacePage />) }],
              },

              {
                element: <PermissionRoute permission="read:gallery" />,
                children: [
                  { path: "gallery-albums", element: withSuspense(<GalleryAlbumsPage />) },
                  { path: "gallery-albums/:id", element: withSuspense(<GalleryAlbumDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:gallery" />,
                children: [{ path: "gallery-albums/create", element: withSuspense(<CreateGalleryAlbumPage />) }],
              },

              {
                element: <PermissionRoute permission="read:team" />,
                children: [
                  { path: "team-members", element: withSuspense(<TeamMembersPage />) },
                  { path: "team-members/:id", element: withSuspense(<TeamMemberDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:team" />,
                children: [{ path: "team-members/create", element: withSuspense(<CreateTeamMemberPage />) }],
              },

              {
                element: <PermissionRoute permission="read:document" />,
                children: [
                  { path: "company-documents", element: withSuspense(<CompanyDocumentsPage />) },
                  { path: "company-documents/:id", element: withSuspense(<CompanyDocumentDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:document" />,
                children: [{ path: "company-documents/create", element: withSuspense(<CreateCompanyDocumentPage />) }],
              },

              {
                element: <PermissionRoute permission="read:service" />,
                children: [
                  { path: "services", element: withSuspense(<ServicesPage />) },
                  { path: "services/:id", element: withSuspense(<ServiceDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:service" />,
                children: [{ path: "services/create", element: withSuspense(<CreateServicePage />) }],
              },

              {
                element: <PermissionRoute permission="read:testimonial" />,
                children: [
                  { path: "testimonials", element: withSuspense(<TestimonialsPage />) },
                  { path: "testimonials/:id", element: withSuspense(<TestimonialDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:testimonial" />,
                children: [{ path: "testimonials/create", element: withSuspense(<CreateTestimonialPage />) }],
              },

              {
                element: <PermissionRoute permission="read:travel" />,
                children: [
                  { path: "trip-infos", element: withSuspense(<TripInfosPage />) },
                  { path: "cost-categories", element: withSuspense(<CostCategoriesPage />) },
                  { path: "story-authors", element: withSuspense(<StoryAuthorsPage />) },
                  { path: "stories", element: withSuspense(<StoriesPage />) },
                  { path: "destinations", element: withSuspense(<DestinationsAdminPage />) },
                  { path: "travel-guides", element: withSuspense(<TravelGuidesAdminPage />) },
                  { path: "web-stories", element: withSuspense(<WebStoriesAdminPage />) },
                  { path: "tour-types", element: withSuspense(<TourTypesAdminPage />) },
                  { path: "regions", element: withSuspense(<RegionsAdminPage />) },
                  { path: "stories/:id", element: withSuspense(<StoryDetailPage />) },
                  { path: "packages", element: withSuspense(<PackagesPage />) },
                  { path: "last-minute-deals", element: withSuspense(<LastMinuteDealsPage />) },
                  { path: "packages/:id", element: withSuspense(<PackageDetailPage />) },
                  { path: "trip-maps", element: withSuspense(<TripMapsPage />) },
                  { path: "trip-maps/:id", element: withSuspense(<TripMapDetailPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="create:travel" />,
                children: [
                  { path: "stories/create", element: withSuspense(<CreateStoryPage />) },
                  { path: "packages/create", element: withSuspense(<CreatePackagePage />) },
                  { path: "trip-maps/create", element: withSuspense(<CreateTripMapPage />) },
                ],
              },

              {
                element: <PermissionRoute permission="read:booking" />,
                children: [
                  { path: "bookings", element: withSuspense(<BookingsPage />) },
                  { path: "custom-bookings", element: withSuspense(<CustomBookingsPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="read:payment" />,
                children: [{ path: "payments", element: withSuspense(<PaymentsPage />) }],
              },

              {
                element: <PermissionRoute permission="read:menu" />,
                children: [
                  { path: "menu-types", element: withSuspense(<MenuTypesPage />) },
                  { path: "menu-items/:typeId", element: withSuspense(<MenuItemsPage />) },
                ],
              },
              {
                element: <PermissionRoute permission="read:settings" />,
                children: [{ path: "global-settings", element: withSuspense(<GlobalSettingsPage />) }],
              },
              {
                element: <PermissionRoute permission="read:redirect" />,
                children: [{ path: "redirects", element: withSuspense(<RedirectsPage />) }],
              },
              {
                element: <PermissionRoute permission="read:activity-log" />,
                children: [{ path: "activity-log", element: withSuspense(<ActivityLogsPage />) }],
              },
            ],
          },
        ],
      },
      { path: PATHS.FORBIDDEN, element: withSuspense(<ForbiddenPage />) },
      { path: "*", element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
