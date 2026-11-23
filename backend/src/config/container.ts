import { AuthRepository } from '../modules/auth/auth.repository';
import { AuthService } from '../modules/auth/auth.service';
import { AuthController } from '../modules/auth/auth.controller';
import { KycStorage } from '../modules/b2b-common/b2b-kyc-storage';
import { B2BOnboardingRepository } from '../modules/b2b-onboarding/b2b-onboarding.repository';
import { B2BOnboardingService } from '../modules/b2b-onboarding/b2b-onboarding.service';
import { B2BOnboardingController } from '../modules/b2b-onboarding/b2b-onboarding.controller';
import { B2BTeamRepository } from '../modules/b2b-team/b2b-team.repository';
import { B2BTeamService } from '../modules/b2b-team/b2b-team.service';
import { B2BTeamController } from '../modules/b2b-team/b2b-team.controller';
import { B2BPricingRepository } from '../modules/b2b-pricing/b2b-pricing.repository';
import { B2BPricingService } from '../modules/b2b-pricing/b2b-pricing.service';
import { B2BPricingController } from '../modules/b2b-pricing/b2b-pricing.controller';
import { B2BInventoryRepository } from '../modules/b2b-inventory/b2b-inventory.repository';
import { B2BInventoryService } from '../modules/b2b-inventory/b2b-inventory.service';
import { B2BInventoryController } from '../modules/b2b-inventory/b2b-inventory.controller';
import { B2BCatalogRepository } from '../modules/b2b-catalog/b2b-catalog.repository';
import { B2BCatalogService } from '../modules/b2b-catalog/b2b-catalog.service';
import { B2BCatalogController } from '../modules/b2b-catalog/b2b-catalog.controller';
import { B2BContractRepository } from '../modules/b2b-contract/b2b-contract.repository';
import { B2BContractService } from '../modules/b2b-contract/b2b-contract.service';
import { B2BContractController } from '../modules/b2b-contract/b2b-contract.controller';
import { B2BAllotmentService } from '../modules/b2b-allotment/b2b-allotment.service';
import { B2BAllotmentController } from '../modules/b2b-allotment/b2b-allotment.controller';
import { B2BFinanceRepository } from '../modules/b2b-finance/b2b-finance.repository';
import { B2BLedgerService } from '../modules/b2b-ledger/b2b-ledger.service';
import { B2BWalletService } from '../modules/b2b-ledger/b2b-wallet.service';
import { B2BWalletController, B2BLedgerAdminController } from '../modules/b2b-ledger/b2b-ledger.controller';
import { B2BBookingService } from '../modules/b2b-booking/b2b-booking.service';
import { B2BBookingController, B2BBookingAdminController } from '../modules/b2b-booking/b2b-booking.controller';
import { B2BIntegrationRepository } from '../modules/b2b-integration/b2b-integration.repository';
import { B2BIntegrationService } from '../modules/b2b-integration/b2b-integration.service';
import { B2BDeveloperController } from '../modules/b2b-integration/b2b-integration.controller';
import { WebhookDispatcher } from '../modules/b2b-integration/webhook-dispatcher';
import { SlidingWindowLimiter } from '../modules/b2b-integration/rate-window';
import { createApiKeyGuard } from '../modules/b2b-integration/api-key.guard';
import { B2BSlaService } from '../modules/b2b-sla/b2b-sla.service';
import { B2BSlaController } from '../modules/b2b-sla/b2b-sla.controller';
import { B2BSettlementRepository } from '../modules/b2b-settlement/b2b-settlement.repository';
import { B2BSettlementService } from '../modules/b2b-settlement/b2b-settlement.service';
import { B2BSettlementController, B2BSettlementAdminController } from '../modules/b2b-settlement/b2b-settlement.controller';
import { B2BAdminRepository } from '../modules/b2b-admin/b2b-admin.repository';
import { B2BAdminService } from '../modules/b2b-admin/b2b-admin.service';
import { B2BAdminController } from '../modules/b2b-admin/b2b-admin.controller';
import { RoleRepository } from '../modules/role/role.repository';
import { RoleService } from '../modules/role/role.service';
import { RoleController } from '../modules/role/role.controller';
import { UserRepository } from '../modules/user/user.repository';
import { UserService } from '../modules/user/user.service';
import { UserController } from '../modules/user/user.controller';
import { FilesService } from '../modules/files/files.service';
import { FilesController } from '../modules/files/files.controller';
import { MediaRepository } from '../modules/media/media.repository';
import { MediaService } from '../modules/media/media.service';
import { MediaController } from '../modules/media/media.controller';
import { AttachmentRepository } from '../modules/attachment/attachment.repository';
import { AttachmentService } from '../modules/attachment/attachment.service';
import { AttachmentController } from '../modules/attachment/attachment.controller';
import { ContactMessageRepository } from '../modules/contact-message/contact-message.repository';
import { ContactMessageService } from '../modules/contact-message/contact-message.service';
import { ContactMessageController } from '../modules/contact-message/contact-message.controller';
import { PageRepository } from '../modules/page/page.repository';
import { PageService } from '../modules/page/page.service';
import { PageController } from '../modules/page/page.controller';
import { CategoryTypeRepository } from '../modules/category-type/category-type.repository';
import { CategoryTypeService } from '../modules/category-type/category-type.service';
import { CategoryTypeController } from '../modules/category-type/category-type.controller';
import { CategoryRepository } from '../modules/category/category.repository';
import { CategoryService } from '../modules/category/category.service';
import { CategoryController } from '../modules/category/category.controller';
import { TagRepository } from '../modules/tag/tag.repository';
import { TagService } from '../modules/tag/tag.service';
import { TagController } from '../modules/tag/tag.controller';
import { BlogAuthorRepository } from '../modules/blog-author/blog-author.repository';
import { BlogAuthorService } from '../modules/blog-author/blog-author.service';
import { BlogAuthorController } from '../modules/blog-author/blog-author.controller';
import { BlogRepository } from '../modules/blog/blog.repository';
import { BlogService } from '../modules/blog/blog.service';
import { BlogController } from '../modules/blog/blog.controller';
import { BlogCommentRepository } from '../modules/blog-comment/blog-comment.repository';
import { BlogCommentService } from '../modules/blog-comment/blog-comment.service';
import { BlogCommentController } from '../modules/blog-comment/blog-comment.controller';
import { FaqRepository } from '../modules/faq/faq.repository';
import { FaqService } from '../modules/faq/faq.service';
import { FaqController } from '../modules/faq/faq.controller';
import { GroupFaqRepository } from '../modules/group-faq/group-faq.repository';
import { GroupFaqService } from '../modules/group-faq/group-faq.service';
import { GroupFaqController } from '../modules/group-faq/group-faq.controller';
import { TestimonialRepository } from '../modules/testimonial/testimonial.repository';
import { TestimonialService } from '../modules/testimonial/testimonial.service';
import { TestimonialController } from '../modules/testimonial/testimonial.controller';
import { PlaceRepository } from '../modules/place/place.repository';
import { PlaceService } from '../modules/place/place.service';
import { PlaceController } from '../modules/place/place.controller';
import { GalleryAlbumRepository } from '../modules/gallery-album/gallery-album.repository';
import { GalleryAlbumService } from '../modules/gallery-album/gallery-album.service';
import { GalleryAlbumController } from '../modules/gallery-album/gallery-album.controller';
import { TeamMemberRepository } from '../modules/team-member/team-member.repository';
import { TeamMemberService } from '../modules/team-member/team-member.service';
import { TeamMemberController } from '../modules/team-member/team-member.controller';
import { CostCategoryRepository } from '../modules/cost-category/cost-category.repository';
import { CostCategoryService } from '../modules/cost-category/cost-category.service';
import { CostCategoryController } from '../modules/cost-category/cost-category.controller';
import { CompanyDocumentRepository } from '../modules/company-document/company-document.repository';
import { CompanyDocumentService } from '../modules/company-document/company-document.service';
import { CompanyDocumentController } from '../modules/company-document/company-document.controller';
import { ServiceRepository } from '../modules/service/service.repository';
import { ServiceService } from '../modules/service/service.service';
import { ServiceController } from '../modules/service/service.controller';
import { TripInfoRepository } from '../modules/trip-info/trip-info.repository';
import { TripInfoService } from '../modules/trip-info/trip-info.service';
import { TripInfoController } from '../modules/trip-info/trip-info.controller';
import { StoryAuthorRepository } from '../modules/story-author/story-author.repository';
import { StoryAuthorService } from '../modules/story-author/story-author.service';
import { StoryAuthorController } from '../modules/story-author/story-author.controller';
import { StoryRepository } from '../modules/story/story.repository';
import { StoryService } from '../modules/story/story.service';
import { StoryController } from '../modules/story/story.controller';
import { SiteContentRepository } from '../modules/site-content/site-content.repository';
import { SiteContentService } from '../modules/site-content/site-content.service';
import { SiteContentController } from '../modules/site-content/site-content.controller';
import { PackageRepository } from '../modules/package/package.repository';
import { PackageService } from '../modules/package/package.service';
import { PackageController } from '../modules/package/package.controller';
import { WeatherRepository } from '../modules/weather/weather.repository';
import { WeatherService } from '../modules/weather/weather.service';
import { WeatherController } from '../modules/weather/weather.controller';
import { DepartureRepository } from '../modules/departure/departure.repository';
import { DepartureService } from '../modules/departure/departure.service';
import { DepartureController } from '../modules/departure/departure.controller';
import { ItineraryRepository } from '../modules/itinerary/itinerary.repository';
import { ItineraryService } from '../modules/itinerary/itinerary.service';
import { ItineraryController } from '../modules/itinerary/itinerary.controller';
import { PackageMapRepository } from '../modules/package-map/package-map.repository';
import { PackageMapService } from '../modules/package-map/package-map.service';
import { PackageMapController } from '../modules/package-map/package-map.controller';
import { BookingRepository } from '../modules/booking/booking.repository';
import { BookingService } from '../modules/booking/booking.service';
import { BookingController } from '../modules/booking/booking.controller';
import { CustomBookingRepository } from '../modules/custom-booking/custom-booking.repository';
import { CustomBookingService } from '../modules/custom-booking/custom-booking.service';
import { CustomBookingController } from '../modules/custom-booking/custom-booking.controller';
import { PaymentRepository } from '../modules/payment/payment.repository';
import { PaymentService } from '../modules/payment/payment.service';
import { PaymentController } from '../modules/payment/payment.controller';
import { PacoClient } from '../modules/payment/paco/paco.client';
import { MenuTypeRepository } from '../modules/menu-type/menu-type.repository';
import { MenuTypeService } from '../modules/menu-type/menu-type.service';
import { MenuTypeController } from '../modules/menu-type/menu-type.controller';
import { MenuItemRepository } from '../modules/menu-item/menu-item.repository';
import { MenuItemService } from '../modules/menu-item/menu-item.service';
import { MenuItemController } from '../modules/menu-item/menu-item.controller';
import { GlobalCategoryRepository } from '../modules/global-category/global-category.repository';
import { GlobalCategoryService } from '../modules/global-category/global-category.service';
import { GlobalCategoryController } from '../modules/global-category/global-category.controller';
import { PageSectionRepository } from '../modules/page-section/page-section.repository';
import { PageSectionService } from '../modules/page-section/page-section.service';
import { PageSectionController } from '../modules/page-section/page-section.controller';
import { GlobalSettingRepository } from '../modules/global-setting/global-setting.repository';
import { GlobalSettingService } from '../modules/global-setting/global-setting.service';
import { GlobalSettingController } from '../modules/global-setting/global-setting.controller';
import { RedirectManagerRepository } from '../modules/redirect-manager/redirect-manager.repository';
import { RedirectManagerService } from '../modules/redirect-manager/redirect-manager.service';
import { RedirectManagerController } from '../modules/redirect-manager/redirect-manager.controller';
import { ActivityLogRepository } from '../modules/activity-log/activity-log.repository';
import { ActivityLogService } from '../modules/activity-log/activity-log.service';
import { ActivityLogController } from '../modules/activity-log/activity-log.controller';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { AnalyticsController } from '../modules/analytics/analytics.controller';
import prisma from './prisma';

// ─── Auth ─────────────────────────────────────────────────────────────────────
const authRepository = new AuthRepository(prisma);
const authService = new AuthService(authRepository);
export const authController = new AuthController(authService);

// ─── Role ─────────────────────────────────────────────────────────────────────
const roleRepository = new RoleRepository(prisma);
const roleService = new RoleService(roleRepository);
export const roleController = new RoleController(roleService);

// ─── User ─────────────────────────────────────────────────────────────────────
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository, roleRepository);
export const userController = new UserController(userService);

// ─── Files ────────────────────────────────────────────────────────────────────
// Exported (not just the controller) — the Media module reuses this service
// directly for saving uploaded content images to local disk.
export const filesService = new FilesService();
export const filesController = new FilesController(filesService);

// ─── Media ────────────────────────────────────────────────────────────────────
const mediaRepository = new MediaRepository(prisma);
const mediaService = new MediaService(mediaRepository, filesService);
export const mediaController = new MediaController(mediaService);

// ─── Attachment ───────────────────────────────────────────────────────────────
// Links a Media row to any owner entity (package, itinerary, blog, ...) via
// ownerType/ownerId/role — reuses mediaRepository to validate mediaId on attach.
const attachmentRepository = new AttachmentRepository(prisma);
const attachmentService = new AttachmentService(attachmentRepository, mediaRepository);
export const attachmentController = new AttachmentController(attachmentService);

// ─── Page ─────────────────────────────────────────────────────────────────────
const pageRepository = new PageRepository(prisma);
const pageService = new PageService(pageRepository);
export const pageController = new PageController(pageService);

// ─── Analytics ────────────────────────────────────────────────────────────────
const analyticsService = new AnalyticsService();
export const analyticsController = new AnalyticsController(analyticsService);

// ─── Category Type ────────────────────────────────────────────────────────────
const categoryTypeRepository = new CategoryTypeRepository(prisma);
const categoryTypeService = new CategoryTypeService(categoryTypeRepository);
export const categoryTypeController = new CategoryTypeController(categoryTypeService);

// ─── Category ─────────────────────────────────────────────────────────────────
const categoryRepository = new CategoryRepository(prisma);
const categoryService = new CategoryService(categoryRepository, categoryTypeRepository);
export const categoryController = new CategoryController(categoryService);

// ─── Tag ──────────────────────────────────────────────────────────────────────
const tagRepository = new TagRepository(prisma);
const tagService = new TagService(tagRepository);
export const tagController = new TagController(tagService);

// ─── Blog Author ──────────────────────────────────────────────────────────────
const blogAuthorRepository = new BlogAuthorRepository(prisma);
const blogAuthorService = new BlogAuthorService(blogAuthorRepository);
export const blogAuthorController = new BlogAuthorController(blogAuthorService);

// ─── Blog ─────────────────────────────────────────────────────────────────────
const blogRepository = new BlogRepository(prisma);
const blogService = new BlogService(blogRepository);
export const blogController = new BlogController(blogService);

// ─── Blog Comment ─────────────────────────────────────────────────────────────
const blogCommentRepository = new BlogCommentRepository(prisma);
const blogCommentService = new BlogCommentService(blogCommentRepository);
export const blogCommentController = new BlogCommentController(blogCommentService);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqRepository = new FaqRepository(prisma);
const faqService = new FaqService(faqRepository);
export const faqController = new FaqController(faqService);

// ─── Group FAQ ────────────────────────────────────────────────────────────────
const groupFaqRepository = new GroupFaqRepository(prisma);
const groupFaqService = new GroupFaqService(groupFaqRepository);
export const groupFaqController = new GroupFaqController(groupFaqService);

// ─── Testimonial ──────────────────────────────────────────────────────────────
const testimonialRepository = new TestimonialRepository(prisma);
const testimonialService = new TestimonialService(testimonialRepository);
export const testimonialController = new TestimonialController(testimonialService);

// ─── Place ────────────────────────────────────────────────────────────────────
const placeRepository = new PlaceRepository(prisma);
const placeService = new PlaceService(placeRepository);
export const placeController = new PlaceController(placeService);

// ─── Gallery Album ────────────────────────────────────────────────────────────
const galleryAlbumRepository = new GalleryAlbumRepository(prisma);
const galleryAlbumService = new GalleryAlbumService(galleryAlbumRepository);
export const galleryAlbumController = new GalleryAlbumController(galleryAlbumService);

// ─── Team Member ──────────────────────────────────────────────────────────────
const teamMemberRepository = new TeamMemberRepository(prisma);
const teamMemberService = new TeamMemberService(teamMemberRepository);
export const teamMemberController = new TeamMemberController(teamMemberService);

const companyDocumentRepository = new CompanyDocumentRepository(prisma);
const companyDocumentService = new CompanyDocumentService(companyDocumentRepository);
export const companyDocumentController = new CompanyDocumentController(companyDocumentService);

const costCategoryRepository = new CostCategoryRepository(prisma);
const costCategoryService = new CostCategoryService(costCategoryRepository);
export const costCategoryController = new CostCategoryController(costCategoryService);

// ─── Homepage Services ───────────────────────────────────────────────────────
const serviceRepository = new ServiceRepository(prisma);
const serviceService = new ServiceService(serviceRepository);
export const serviceController = new ServiceController(serviceService);

// ─── Trip Info ────────────────────────────────────────────────────────────────
const tripInfoRepository = new TripInfoRepository(prisma);
const tripInfoService = new TripInfoService(tripInfoRepository);
export const tripInfoController = new TripInfoController(tripInfoService);

// ─── Story Author ─────────────────────────────────────────────────────────────
const storyAuthorRepository = new StoryAuthorRepository(prisma);
const storyAuthorService = new StoryAuthorService(storyAuthorRepository);
export const storyAuthorController = new StoryAuthorController(storyAuthorService);

// ─── Story ────────────────────────────────────────────────────────────────────
const storyRepository = new StoryRepository(prisma);
const storyService = new StoryService(storyRepository);
export const storyController = new StoryController(storyService);

// ─── Site content (destinations, travel guides, web stories) ─────────────────
const siteContentRepository = new SiteContentRepository(prisma);
const siteContentService = new SiteContentService(siteContentRepository);
export const siteContentController = new SiteContentController(siteContentService);

// ─── Package ──────────────────────────────────────────────────────────────────
const packageRepository = new PackageRepository(prisma);
const packageService = new PackageService(packageRepository);
export const packageController = new PackageController(packageService);

// ─── Public package weather ──────────────────────────────────────────────────
const weatherRepository = new WeatherRepository(prisma);
const weatherService = new WeatherService(weatherRepository);
export const weatherController = new WeatherController(weatherService);

// ─── Departure ────────────────────────────────────────────────────────────────
const departureRepository = new DepartureRepository(prisma);
const departureService = new DepartureService(departureRepository);
export const departureController = new DepartureController(departureService);

// ─── Package Map ("Trip Map") ───────────────────────────────────────────────
const packageMapRepository = new PackageMapRepository(prisma);
const packageMapService = new PackageMapService(packageMapRepository);
export const packageMapController = new PackageMapController(packageMapService);

// ─── Itinerary ────────────────────────────────────────────────────────────────
const itineraryRepository = new ItineraryRepository(prisma);
const itineraryService = new ItineraryService(itineraryRepository);
export const itineraryController = new ItineraryController(itineraryService);

// ─── Booking ──────────────────────────────────────────────────────────────────
const bookingRepository = new BookingRepository(prisma);
const bookingService = new BookingService(bookingRepository);
export const bookingController = new BookingController(bookingService);

// ─── Custom Booking ───────────────────────────────────────────────────────────
const customBookingRepository = new CustomBookingRepository(prisma);
const customBookingService = new CustomBookingService(customBookingRepository);
export const customBookingController = new CustomBookingController(customBookingService);

// ─── Payment ──────────────────────────────────────────────────────────────────
const paymentRepository = new PaymentRepository(prisma);
const pacoClient = new PacoClient();
const paymentService = new PaymentService(paymentRepository, pacoClient, bookingService);
export const paymentController = new PaymentController(paymentService);

// ─── Menu Type ────────────────────────────────────────────────────────────────
const menuTypeRepository = new MenuTypeRepository(prisma);
const menuTypeService = new MenuTypeService(menuTypeRepository);
export const menuTypeController = new MenuTypeController(menuTypeService);

// ─── Menu Item ────────────────────────────────────────────────────────────────
const menuItemRepository = new MenuItemRepository(prisma);
const menuItemService = new MenuItemService(menuItemRepository, menuTypeRepository);
export const menuItemController = new MenuItemController(menuItemService);

// ─── Global Category ──────────────────────────────────────────────────────────
const globalCategoryRepository = new GlobalCategoryRepository(prisma);
const globalCategoryService = new GlobalCategoryService(globalCategoryRepository);
export const globalCategoryController = new GlobalCategoryController(globalCategoryService);

// ─── Global Setting ───────────────────────────────────────────────────────────
const globalSettingRepository = new GlobalSettingRepository(prisma);
const globalSettingService = new GlobalSettingService(globalSettingRepository);
export const globalSettingController = new GlobalSettingController(globalSettingService);

// ─── Redirect Manager ─────────────────────────────────────────────────────────
const redirectManagerRepository = new RedirectManagerRepository(prisma);
const redirectManagerService = new RedirectManagerService(redirectManagerRepository);
export const redirectManagerController = new RedirectManagerController(redirectManagerService);

// ─── Activity Log ─────────────────────────────────────────────────────────────
// Exported (not just the controller) — other services can constructor-inject
// this repository directly to write audit entries via .log(...).
export const activityLogRepository = new ActivityLogRepository(prisma);
const activityLogService = new ActivityLogService(activityLogRepository, userRepository);
export const activityLogController = new ActivityLogController(activityLogService);

// ─── Contact Message ──────────────────────────────────────────────────────────
const contactMessageRepository = new ContactMessageRepository(prisma);
const contactMessageService = new ContactMessageService(contactMessageRepository);
export const contactMessageController = new ContactMessageController(contactMessageService);

// ─── Add new modules above this line ─────────────────────────────────────────
// All modules from the drafted schema are now scaffolded. Travel/Booking/
// Payment fields are still pending reconciliation against the real SQL dump.

const pageSectionRepository = new PageSectionRepository(prisma);
const pageSectionService = new PageSectionService(pageSectionRepository);
export const pageSectionController = new PageSectionController(pageSectionService);

// ─── B2B (partner onboarding, team, internal admin) ───────────────────────────
const kycStorage = new KycStorage();
const b2bOnboardingRepository = new B2BOnboardingRepository(prisma);
export const b2bOnboardingController = new B2BOnboardingController(new B2BOnboardingService(b2bOnboardingRepository, kycStorage));
const b2bTeamRepository = new B2BTeamRepository(prisma);
export const b2bTeamController = new B2BTeamController(new B2BTeamService(b2bTeamRepository));
const b2bAdminRepository = new B2BAdminRepository(prisma);
export const b2bAdminController = new B2BAdminController(new B2BAdminService(b2bAdminRepository, kycStorage));

// ─── B2B Phase 2: pricing, inventory holds, catalog, contracts, allotments ────
const b2bPricingRepository = new B2BPricingRepository(prisma);
const b2bInventoryRepository = new B2BInventoryRepository(prisma);
// Exported: server.ts starts the hold-expiry scheduler with this instance.
export const b2bInventoryService = new B2BInventoryService(b2bInventoryRepository);
export const b2bInventoryController = new B2BInventoryController(b2bInventoryService);
export const b2bPricingController = new B2BPricingController(new B2BPricingService(b2bPricingRepository, b2bInventoryService));
export const b2bCatalogController = new B2BCatalogController(new B2BCatalogService(new B2BCatalogRepository(prisma), b2bPricingRepository));
export const b2bContractController = new B2BContractController(new B2BContractService(new B2BContractRepository(prisma)));
export const b2bAllotmentController = new B2BAllotmentController(new B2BAllotmentService(b2bInventoryRepository));

// ─── B2B Phase 3: ledger, wallet, bookings ────────────────────────────────────
const b2bFinanceRepository = new B2BFinanceRepository(prisma);
const b2bLedgerService = new B2BLedgerService(b2bFinanceRepository);
// Constructing the wallet service registers its idempotent "top-up payment succeeded" listener on paymentService.
export const b2bWalletController = new B2BWalletController(new B2BWalletService(b2bLedgerService, b2bFinanceRepository, paymentService));
export const b2bLedgerAdminController = new B2BLedgerAdminController(b2bLedgerService);
// Webhook outbox sender + API-key limiter (Phase 4). Declared before the booking service, which wakes the sender after commits.
const b2bIntegrationRepository = new B2BIntegrationRepository(prisma);
export const apiKeyLimiter = new SlidingWindowLimiter();
export const webhookDispatcher = new WebhookDispatcher(b2bIntegrationRepository, (err) => console.error('❌ Webhook dispatch failed:', err));
const b2bBookingService = new B2BBookingService(b2bFinanceRepository, b2bLedgerService, webhookDispatcher);
export const b2bBookingController = new B2BBookingController(b2bBookingService);
export const b2bBookingAdminController = new B2BBookingAdminController(b2bBookingService);

// ─── B2B Phase 4: developer portal, API v1, SLA, settlements ──────────────────
export const apiKeyAuth = createApiKeyGuard(b2bIntegrationRepository, apiKeyLimiter);
export const b2bDeveloperController = new B2BDeveloperController(new B2BIntegrationService(b2bIntegrationRepository, webhookDispatcher, apiKeyLimiter));
export const b2bSlaService = new B2BSlaService(b2bFinanceRepository, webhookDispatcher);
export const b2bSlaController = new B2BSlaController(b2bSlaService);
const b2bSettlementService = new B2BSettlementService(new B2BSettlementRepository(prisma), b2bFinanceRepository, b2bLedgerService);
export const b2bSettlementController = new B2BSettlementController(b2bSettlementService);
export const b2bSettlementAdminController = new B2BSettlementAdminController(b2bSettlementService);
