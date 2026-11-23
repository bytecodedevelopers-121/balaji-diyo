-- Baseline: single squashed migration for the initial release.
-- Contains the full schema, required seed rows, the booking-number sequence start,
-- and the hand-written B2B integrity rules (CHECKs, append-only ledger trigger, partial unique index).

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AttachmentRole" AS ENUM ('AVATAR', 'BANNER', 'SINGLE_BANNER', 'CAROUSEL', 'FEATURED', 'REEL', 'GALLERY', 'MAP');

-- CreateEnum
CREATE TYPE "SettingValueType" AS ENUM ('STRING', 'TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'IMAGE', 'FILE', 'DATE', 'JSON');

-- CreateEnum
CREATE TYPE "CostDetailType" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateEnum
CREATE TYPE "AddOnChargeBy" AS ENUM ('PERSON', 'ROOM', 'FLAT');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('NABIL', 'HBL', 'NICA', 'PACO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "B2BPartnerStatus" AS ENUM ('PENDING_KYC', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "B2BUserRole" AS ENUM ('AGENCY_ADMIN', 'BOOKING_AGENT', 'FINANCE_MANAGER');

-- CreateEnum
CREATE TYPE "B2BRateType" AS ENUM ('NET', 'COMMISSIONABLE');

-- CreateEnum
CREATE TYPE "B2BBookingChannel" AS ENUM ('B2C', 'B2B');

-- CreateEnum
CREATE TYPE "B2BBookingStatus" AS ENUM ('DRAFT', 'HELD', 'PENDING_APPROVAL', 'CONFIRMED', 'AMENDMENT_REQUESTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('WALLET_TOPUP', 'BOOKING_DEBIT', 'CREDIT_LINE_DRAW', 'CREDIT_LINE_REPAYMENT', 'REFUND_CREDIT', 'COMMISSION_CREDIT', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('WALLET', 'CREDIT');

-- CreateEnum
CREATE TYPE "SlaTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'BREACHED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "avatar" TEXT,
    "roleId" TEXT NOT NULL,
    "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false,
    "b2bPartnerId" TEXT,
    "b2bRole" "B2BUserRole",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "mime" TEXT,
    "extension" TEXT,
    "altText" TEXT,
    "caption" TEXT,
    "fullName" TEXT NOT NULL,
    "fullPath" TEXT NOT NULL,
    "thumbName" TEXT,
    "thumbPath" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "role" "AttachmentRole" NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "reelUrl" TEXT,
    "shortDescription" TEXT,
    "isFeatured" BOOLEAN DEFAULT false,
    "contentUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaKeywords" TEXT,
    "metaDescription" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "url_infos" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "urlTitle" TEXT,
    "urlSlug" TEXT NOT NULL,
    "canonical" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "url_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "redirect_manager" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "isPermanent" BOOLEAN NOT NULL DEFAULT true,
    "redirectCode" TEXT,
    "redirectMessage" TEXT,
    "redirectStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "redirect_manager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "loggerType" TEXT NOT NULL,
    "loggerId" TEXT NOT NULL,
    "primaryAction" TEXT,
    "clientAction" TEXT,
    "actionMethod" TEXT,
    "actionData" JSONB,
    "actionResponse" JSONB,
    "actionCategory" TEXT,
    "actionCategoryKey" TEXT,
    "actionCategoryId" TEXT,
    "actionTitle" TEXT,
    "actionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "global_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyGroup" TEXT,
    "categoryId" TEXT,
    "label" TEXT,
    "valueType" "SettingValueType" NOT NULL,
    "value" TEXT,
    "jsonValue" JSONB,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "global_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_types" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "category_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "extraField1" TEXT,
    "categoryOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "typeId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_types" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "menu_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "itemOrder" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT NOT NULL,
    "isExternal" BOOLEAN NOT NULL DEFAULT false,
    "externalLink" TEXT,
    "urlSegment" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "typeId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "pageOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "linkedPagePath" TEXT,
    "linkedPageLabel" TEXT,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_authors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salutation" TEXT,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "content" TEXT NOT NULL,
    "blogDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_comments" (
    "id" TEXT NOT NULL,
    "blogId" TEXT NOT NULL,
    "parentId" TEXT,
    "commentorName" TEXT NOT NULL,
    "commentorEmail" TEXT,
    "commentorAddress" TEXT,
    "commentorContact" TEXT,
    "comment" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "faqOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "faqOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "salutation" TEXT,
    "fullName" TEXT NOT NULL,
    "reviewAbstract" TEXT,
    "reviewTitle" TEXT,
    "review" TEXT NOT NULL,
    "reviewRating" DECIMAL(3,1),
    "reviewDate" TIMESTAMP(3),
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "address" TEXT,
    "affiliateOrganization" TEXT,
    "organizationAddress" TEXT,
    "organizationPosition" TEXT,
    "organizationDescription" TEXT,
    "organizationLink" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "places" (
    "id" TEXT NOT NULL,
    "placeName" TEXT NOT NULL,
    "placeAbstract" TEXT,
    "placeDescription" TEXT,
    "placeElevation" TEXT,
    "placeCoordinates" TEXT,
    "placeMap" TEXT,
    "placeExtra" TEXT,
    "attractionOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "placeTypeId" TEXT,
    "routeMapId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "place_regions" (
    "placeId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "place_regions_pkey" PRIMARY KEY ("placeId","categoryId")
);

-- CreateTable
CREATE TABLE "place_facts" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_albums" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "destinationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "gallery_albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "positionOrder" INTEGER NOT NULL DEFAULT 0,
    "salutation" TEXT,
    "fullName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "countryCode" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,
    "memberAddress" TEXT NOT NULL,
    "memberPhone" TEXT,
    "memberEmail" TEXT,
    "memberFacebook" TEXT,
    "memberTwitter" TEXT,
    "memberInstagram" TEXT,
    "memberWebsite" TEXT,
    "quoteAbstract" TEXT,
    "quote" TEXT,
    "description" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'legal',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "secondaryDescription" TEXT,
    "imageUrl" TEXT NOT NULL,
    "ctaLabel" TEXT NOT NULL DEFAULT 'Know More',
    "ctaUrl" TEXT NOT NULL DEFAULT '/about-us',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_section_configs" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_section_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "details" TEXT,
    "tripInfoText" TEXT,
    "highlights" TEXT,
    "costIncludesText" TEXT,
    "costExcludesText" TEXT,
    "extraFaqs" JSONB,
    "packingListIntro" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "duration" DECIMAL(6,2) NOT NULL,
    "durationType" TEXT NOT NULL,
    "groupSize" TEXT,
    "discount" DECIMAL(12,2),
    "maxAltitude" TEXT,
    "geoLongitude" TEXT,
    "geoLatitude" TEXT,
    "usefulInfo" TEXT,
    "departureNote" TEXT,
    "additionalField1" TEXT,
    "additionalField2" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "popularSortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinationId" TEXT NOT NULL,
    "gradeId" TEXT,
    "styleId" TEXT,
    "transportationId" TEXT,
    "mealsId" TEXT,
    "accommodationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_package_orders" (
    "categoryId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "category_package_orders_pkey" PRIMARY KEY ("categoryId","packageId")
);

-- CreateTable
CREATE TABLE "cost_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CostDetailType" NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "cost_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_cost_details" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "costCategoryId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "detailKey" TEXT NOT NULL,
    "detailTitle" TEXT NOT NULL,
    "detailDescription" TEXT,
    "detailExtra" TEXT,
    "detailType" "CostDetailType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_cost_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_price_groups" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageTier" TEXT NOT NULL,
    "minPeople" INTEGER NOT NULL,
    "maxPeople" INTEGER NOT NULL,
    "shortDescription" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "offerUnitPrice" DECIMAL(12,2),
    "offerLabel" TEXT,
    "offerInformation" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_price_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_facts" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "factTitle" TEXT NOT NULL,
    "factValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_gear_items" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "itemLabel" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_gear_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_addons" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "addonTitle" TEXT NOT NULL,
    "addonDescription" TEXT,
    "addonPrice" DECIMAL(12,2) NOT NULL,
    "addonUnit" TEXT,
    "chargeBy" "AddOnChargeBy" NOT NULL DEFAULT 'PERSON',
    "peoplePerRoom" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_tiers" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "packageTier" TEXT NOT NULL,
    "packageTierAlias" TEXT NOT NULL,
    "packageTierDescription" TEXT NOT NULL,
    "costIncludes" TEXT,
    "costExcludes" TEXT,
    "wetravelUuid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_departures" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "departureCost" DECIMAL(12,2) NOT NULL,
    "departureNote" TEXT,
    "departureStatus" TEXT NOT NULL,
    "isLastMinute" BOOLEAN NOT NULL DEFAULT false,
    "totalSeats" INTEGER,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "heldSeats" INTEGER NOT NULL DEFAULT 0,
    "cutoffHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_departures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_infos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "infoOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itineraries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "detailsText" TEXT,
    "mapData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "itineraries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_details" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "itineraryDay" TEXT NOT NULL,
    "itineraryTitle" TEXT,
    "itineraryShortDescription" TEXT,
    "itineraryDescription" TEXT,
    "itineraryStop" DECIMAL(6,2),
    "accommodation" TEXT,
    "meals" TEXT,
    "lunchPlace" TEXT,
    "origin" TEXT,
    "originCoordinate" TEXT,
    "originElevation" TEXT,
    "originPlaceId" TEXT,
    "destination" TEXT,
    "destinationCoordinate" TEXT,
    "destinationElevation" TEXT,
    "destinationPlaceId" TEXT,
    "travelMode" TEXT,
    "distance" TEXT,
    "duration" TEXT,
    "encodedPolyline" TEXT,
    "footnote" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_facts" (
    "id" TEXT NOT NULL,
    "detailId" TEXT NOT NULL,
    "factTitle" TEXT NOT NULL,
    "factValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_facts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_maps" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "mapTitle" TEXT NOT NULL,
    "mapAbstract" TEXT,
    "mapDetails" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "package_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_authors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "salutation" TEXT,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "story_authors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "abstract" TEXT,
    "content" TEXT NOT NULL,
    "storyDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "bookingNumber" SERIAL NOT NULL,
    "packageId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "numberOfTraveller" INTEGER NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "pickupDetails" TEXT,
    "paymentOptions" TEXT NOT NULL,
    "totalPrice" DECIMAL(12,2) NOT NULL,
    "payablePercentage" INTEGER,
    "ipAddress" TEXT,
    "channel" "B2BBookingChannel" NOT NULL DEFAULT 'B2C',
    "b2bPartnerId" TEXT,
    "b2bStatus" "B2BBookingStatus",
    "agentMarkup" DECIMAL(12,2),
    "commissionAmount" DECIMAL(12,2),
    "netPayable" DECIMAL(12,2),
    "departureId" TEXT,
    "b2bStatusReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travellers" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "passportNo" TEXT,
    "passportImage" TEXT,
    "photo" TEXT,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_bookings" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "numberOfTraveller" INTEGER NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "arrivalFlightNo" TEXT,
    "airportPickup" BOOLEAN NOT NULL DEFAULT false,
    "departureDate" TIMESTAMP(3),
    "departureFlightNo" TEXT,
    "airportDropoff" BOOLEAN NOT NULL DEFAULT false,
    "travelInsurance" BOOLEAN NOT NULL DEFAULT false,
    "findingUs" TEXT,
    "specialRequirement" TEXT,
    "ipAddress" TEXT,
    "channel" "B2BBookingChannel" NOT NULL DEFAULT 'B2C',
    "b2bPartnerId" TEXT,
    "b2bStatus" "B2BBookingStatus",
    "b2bStatusReason" TEXT,
    "netPayable" DECIMAL(12,2),
    "fundingMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_travellers" (
    "id" TEXT NOT NULL,
    "customBookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "mobileNumber" TEXT,
    "passportNo" TEXT,
    "passportImage" TEXT,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_travellers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "invoiceAmount" DECIMAL(12,2) NOT NULL,
    "invoicePayType" TEXT NOT NULL,
    "invoiceStatus" INTEGER NOT NULL,
    "invoiceNote" TEXT,
    "transactionCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "gateway" "PaymentGateway" NOT NULL,
    "packageId" TEXT,
    "bookingId" TEXT,
    "customTitle" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "description" TEXT,
    "percentage" INTEGER,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(12,4),
    "chargedAmount" DECIMAL(14,2),
    "b2bPartnerId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayReference" TEXT,
    "gatewayTransactionId" TEXT,
    "gatewaySignature" TEXT,
    "gatewaySessionId" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "packageId" TEXT,
    "numberOfTraveller" INTEGER,
    "ipAddress" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_greetings_sent" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birthday_greetings_sent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birthday_optouts" (
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "birthday_optouts_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "destinations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryLabel" TEXT NOT NULL,
    "heroImage" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "cards" JSONB NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_guides" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "travel_guide_topics" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "intro" JSONB,
    "sections" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "travel_guide_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_stories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "slides" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "web_stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_sections" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_partner_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "priorityOrder" INTEGER NOT NULL DEFAULT 0,
    "defaultRateType" "B2BRateType" NOT NULL DEFAULT 'COMMISSIONABLE',
    "defaultCommissionPct" DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    "defaultCreditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditTermDays" INTEGER NOT NULL DEFAULT 0,
    "holdDurationMinutes" INTEGER NOT NULL DEFAULT 30,
    "slaResponseHours" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_partner_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_partners" (
    "id" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "website" TEXT,
    "taxOrRegNumber" TEXT,
    "status" "B2BPartnerStatus" NOT NULL DEFAULT 'PENDING_KYC',
    "kycVerifiedAt" TIMESTAMP(3),
    "kycVerifiedById" TEXT,
    "rejectionReason" TEXT,
    "tierId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "walletBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditUsed" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditAlertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "b2b_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_kyc_documents" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_partner_contracts" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "rateType" "B2BRateType" NOT NULL DEFAULT 'NET',
    "netUnitPrice" DECIMAL(12,2),
    "commissionPct" DECIMAL(5,2),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "blackoutDates" JSONB,
    "minPax" INTEGER,
    "maxPax" INTEGER,
    "cutoffHours" INTEGER NOT NULL DEFAULT 48,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_partner_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_inventory_allotments" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "allocatedSeats" INTEGER NOT NULL,
    "bookedSeats" INTEGER NOT NULL DEFAULT 0,
    "heldSeats" INTEGER NOT NULL DEFAULT 0,
    "releaseBeforeHours" INTEGER NOT NULL DEFAULT 72,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_inventory_allotments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_inventory_holds" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "departureId" TEXT NOT NULL,
    "seatsHeld" INTEGER NOT NULL,
    "allotmentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),
    "convertedBookingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_inventory_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_ledger_entries" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "account" "LedgerAccount" NOT NULL DEFAULT 'WALLET',
    "direction" "LedgerDirection" NOT NULL,
    "entryType" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "balanceAfter" DECIMAL(12,2) NOT NULL,
    "creditUsedAfter" DECIMAL(12,2) NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "description" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_booking_amendments" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "payload" JSONB NOT NULL,
    "requestedById" TEXT,
    "resolvedById" TEXT,
    "resolutionNote" TEXT,
    "priceDelta" DECIMAL(12,2),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_booking_amendments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_api_keys" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "rateLimitRpm" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "b2b_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_webhook_endpoints" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "endpointId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "nextRetryAt" TIMESTAMP(3),
    "lastResponseCode" INTEGER,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "b2b_sla_tickets" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "bookingId" TEXT,
    "customBookingId" TEXT,
    "subject" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" "SlaTicketStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3) NOT NULL,
    "escalatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "b2b_sla_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RolePermissions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RolePermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TeamMemberCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeamMemberCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GroupFaqCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GroupFaqCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackageCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackageFaqCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageFaqCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BlogAuthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogAuthors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BlogCategories" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogCategories_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BlogTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_BlogPlaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BlogPlaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackageFaqs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageFaqs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackageGroupFaqs" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageGroupFaqs_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TeamMemberTestimonials" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeamMemberTestimonials_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackagePlaces" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackagePlaces_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackageTripInfos" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageTripInfos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackageTestimonials" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageTestimonials_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PackageCustomRelated" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PackageCustomRelated_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_StoryAuthors" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StoryAuthors_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_b2bPartnerId_idx" ON "users"("b2bPartnerId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_subject_key" ON "permissions"("action", "subject");

-- CreateIndex
CREATE INDEX "attachments_ownerType_ownerId_role_idx" ON "attachments"("ownerType", "ownerId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "meta_ownerType_ownerId_key" ON "meta"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "url_infos_ownerType_ownerId_key" ON "url_infos"("ownerType", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "url_infos_ownerType_urlSlug_key" ON "url_infos"("ownerType", "urlSlug");

-- CreateIndex
CREATE UNIQUE INDEX "redirect_manager_source_key" ON "redirect_manager"("source");

-- CreateIndex
CREATE INDEX "activity_logs_loggerType_loggerId_idx" ON "activity_logs"("loggerType", "loggerId");

-- CreateIndex
CREATE UNIQUE INDEX "global_categories_key_key" ON "global_categories"("key");

-- CreateIndex
CREATE UNIQUE INDEX "global_settings_key_key" ON "global_settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "category_types_key_key" ON "category_types"("key");

-- CreateIndex
CREATE UNIQUE INDEX "menu_types_key_key" ON "menu_types"("key");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_authors_email_key" ON "blog_authors"("email");

-- CreateIndex
CREATE INDEX "places_routeMapId_idx" ON "places"("routeMapId");

-- CreateIndex
CREATE INDEX "place_regions_categoryId_sortOrder_idx" ON "place_regions"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "place_facts_placeId_sortOrder_idx" ON "place_facts"("placeId", "sortOrder");

-- CreateIndex
CREATE INDEX "gallery_albums_destinationId_displayOrder_idx" ON "gallery_albums"("destinationId", "displayOrder");

-- CreateIndex
CREATE INDEX "services_isActive_sortOrder_idx" ON "services"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "packages_isFeatured_sortOrder_idx" ON "packages"("isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "packages_isPopular_popularSortOrder_idx" ON "packages"("isPopular", "popularSortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_packageId_key" ON "itineraries"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "story_authors_email_key" ON "story_authors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_bookingNumber_key" ON "bookings"("bookingNumber");

-- CreateIndex
CREATE INDEX "bookings_b2bPartnerId_idx" ON "bookings"("b2bPartnerId");

-- CreateIndex
CREATE INDEX "custom_bookings_b2bPartnerId_idx" ON "custom_bookings"("b2bPartnerId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_bookingId_key" ON "invoices"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "birthday_greetings_sent_email_year_key" ON "birthday_greetings_sent"("email", "year");

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "travel_guides_slug_key" ON "travel_guides"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "travel_guide_topics_guideId_slug_key" ON "travel_guide_topics"("guideId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "web_stories_slug_key" ON "web_stories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "page_sections_pageKey_sectionKey_key" ON "page_sections"("pageKey", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_partner_tiers_name_key" ON "b2b_partner_tiers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_partner_tiers_code_key" ON "b2b_partner_tiers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_partners_partnerCode_key" ON "b2b_partners"("partnerCode");

-- CreateIndex
CREATE INDEX "b2b_partners_status_tierId_idx" ON "b2b_partners"("status", "tierId");

-- CreateIndex
CREATE INDEX "b2b_kyc_documents_partnerId_idx" ON "b2b_kyc_documents"("partnerId");

-- CreateIndex
CREATE INDEX "b2b_partner_contracts_partnerId_packageId_isActive_idx" ON "b2b_partner_contracts"("partnerId", "packageId", "isActive");

-- CreateIndex
CREATE INDEX "b2b_inventory_allotments_departureId_idx" ON "b2b_inventory_allotments"("departureId");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_inventory_allotments_partnerId_departureId_key" ON "b2b_inventory_allotments"("partnerId", "departureId");

-- CreateIndex
CREATE INDEX "b2b_inventory_holds_status_expiresAt_idx" ON "b2b_inventory_holds"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "b2b_inventory_holds_partnerId_status_idx" ON "b2b_inventory_holds"("partnerId", "status");

-- CreateIndex
CREATE INDEX "b2b_ledger_entries_partnerId_createdAt_idx" ON "b2b_ledger_entries"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "b2b_ledger_entries_referenceType_referenceId_idx" ON "b2b_ledger_entries"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "b2b_booking_amendments_bookingId_status_idx" ON "b2b_booking_amendments"("bookingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "b2b_api_keys_keyHash_key" ON "b2b_api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "b2b_api_keys_partnerId_isActive_idx" ON "b2b_api_keys"("partnerId", "isActive");

-- CreateIndex
CREATE INDEX "b2b_webhook_endpoints_partnerId_isActive_idx" ON "b2b_webhook_endpoints"("partnerId", "isActive");

-- CreateIndex
CREATE INDEX "b2b_webhook_deliveries_status_nextRetryAt_idx" ON "b2b_webhook_deliveries"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "b2b_webhook_deliveries_partnerId_createdAt_idx" ON "b2b_webhook_deliveries"("partnerId", "createdAt");

-- CreateIndex
CREATE INDEX "b2b_webhook_deliveries_endpointId_createdAt_idx" ON "b2b_webhook_deliveries"("endpointId", "createdAt");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_status_dueAt_idx" ON "b2b_sla_tickets"("status", "dueAt");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_partnerId_status_idx" ON "b2b_sla_tickets"("partnerId", "status");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_bookingId_idx" ON "b2b_sla_tickets"("bookingId");

-- CreateIndex
CREATE INDEX "b2b_sla_tickets_customBookingId_idx" ON "b2b_sla_tickets"("customBookingId");

-- CreateIndex
CREATE INDEX "_RolePermissions_B_index" ON "_RolePermissions"("B");

-- CreateIndex
CREATE INDEX "_TeamMemberCategories_B_index" ON "_TeamMemberCategories"("B");

-- CreateIndex
CREATE INDEX "_GroupFaqCategories_B_index" ON "_GroupFaqCategories"("B");

-- CreateIndex
CREATE INDEX "_PackageCategories_B_index" ON "_PackageCategories"("B");

-- CreateIndex
CREATE INDEX "_PackageFaqCategories_B_index" ON "_PackageFaqCategories"("B");

-- CreateIndex
CREATE INDEX "_BlogAuthors_B_index" ON "_BlogAuthors"("B");

-- CreateIndex
CREATE INDEX "_BlogCategories_B_index" ON "_BlogCategories"("B");

-- CreateIndex
CREATE INDEX "_BlogTags_B_index" ON "_BlogTags"("B");

-- CreateIndex
CREATE INDEX "_BlogPlaces_B_index" ON "_BlogPlaces"("B");

-- CreateIndex
CREATE INDEX "_PackageFaqs_B_index" ON "_PackageFaqs"("B");

-- CreateIndex
CREATE INDEX "_PackageGroupFaqs_B_index" ON "_PackageGroupFaqs"("B");

-- CreateIndex
CREATE INDEX "_TeamMemberTestimonials_B_index" ON "_TeamMemberTestimonials"("B");

-- CreateIndex
CREATE INDEX "_PackagePlaces_B_index" ON "_PackagePlaces"("B");

-- CreateIndex
CREATE INDEX "_PackageTripInfos_B_index" ON "_PackageTripInfos"("B");

-- CreateIndex
CREATE INDEX "_PackageTestimonials_B_index" ON "_PackageTestimonials"("B");

-- CreateIndex
CREATE INDEX "_PackageCustomRelated_B_index" ON "_PackageCustomRelated"("B");

-- CreateIndex
CREATE INDEX "_StoryAuthors_B_index" ON "_StoryAuthors"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "global_settings" ADD CONSTRAINT "global_settings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "global_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "category_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "menu_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_placeTypeId_fkey" FOREIGN KEY ("placeTypeId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_routeMapId_fkey" FOREIGN KEY ("routeMapId") REFERENCES "package_maps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_regions" ADD CONSTRAINT "place_regions_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_regions" ADD CONSTRAINT "place_regions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_facts" ADD CONSTRAINT "place_facts_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gallery_albums" ADD CONSTRAINT "gallery_albums_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_transportationId_fkey" FOREIGN KEY ("transportationId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_mealsId_fkey" FOREIGN KEY ("mealsId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_package_orders" ADD CONSTRAINT "category_package_orders_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "category_package_orders" ADD CONSTRAINT "category_package_orders_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_cost_details" ADD CONSTRAINT "package_cost_details_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_cost_details" ADD CONSTRAINT "package_cost_details_costCategoryId_fkey" FOREIGN KEY ("costCategoryId") REFERENCES "cost_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_price_groups" ADD CONSTRAINT "package_price_groups_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_facts" ADD CONSTRAINT "package_facts_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_gear_items" ADD CONSTRAINT "package_gear_items_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_addons" ADD CONSTRAINT "package_addons_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_tiers" ADD CONSTRAINT "package_tiers_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_departures" ADD CONSTRAINT "package_departures_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_details" ADD CONSTRAINT "itinerary_details_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_details" ADD CONSTRAINT "itinerary_details_originPlaceId_fkey" FOREIGN KEY ("originPlaceId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_details" ADD CONSTRAINT "itinerary_details_destinationPlaceId_fkey" FOREIGN KEY ("destinationPlaceId") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_facts" ADD CONSTRAINT "itinerary_facts_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "itinerary_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_maps" ADD CONSTRAINT "package_maps_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "package_departures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travellers" ADD CONSTRAINT "travellers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_bookings" ADD CONSTRAINT "custom_bookings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_bookings" ADD CONSTRAINT "custom_bookings_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_travellers" ADD CONSTRAINT "custom_travellers_customBookingId_fkey" FOREIGN KEY ("customBookingId") REFERENCES "custom_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_b2bPartnerId_fkey" FOREIGN KEY ("b2bPartnerId") REFERENCES "b2b_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travel_guide_topics" ADD CONSTRAINT "travel_guide_topics_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "travel_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_partners" ADD CONSTRAINT "b2b_partners_tierId_fkey" FOREIGN KEY ("tierId") REFERENCES "b2b_partner_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_kyc_documents" ADD CONSTRAINT "b2b_kyc_documents_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_partner_contracts" ADD CONSTRAINT "b2b_partner_contracts_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_partner_contracts" ADD CONSTRAINT "b2b_partner_contracts_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_allotments" ADD CONSTRAINT "b2b_inventory_allotments_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_allotments" ADD CONSTRAINT "b2b_inventory_allotments_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "package_departures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_holds" ADD CONSTRAINT "b2b_inventory_holds_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_inventory_holds" ADD CONSTRAINT "b2b_inventory_holds_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "package_departures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_ledger_entries" ADD CONSTRAINT "b2b_ledger_entries_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_booking_amendments" ADD CONSTRAINT "b2b_booking_amendments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_api_keys" ADD CONSTRAINT "b2b_api_keys_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_webhook_endpoints" ADD CONSTRAINT "b2b_webhook_endpoints_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_webhook_deliveries" ADD CONSTRAINT "b2b_webhook_deliveries_endpointId_fkey" FOREIGN KEY ("endpointId") REFERENCES "b2b_webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "b2b_sla_tickets" ADD CONSTRAINT "b2b_sla_tickets_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "b2b_partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RolePermissions" ADD CONSTRAINT "_RolePermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMemberCategories" ADD CONSTRAINT "_TeamMemberCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMemberCategories" ADD CONSTRAINT "_TeamMemberCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupFaqCategories" ADD CONSTRAINT "_GroupFaqCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupFaqCategories" ADD CONSTRAINT "_GroupFaqCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "group_faqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCategories" ADD CONSTRAINT "_PackageCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCategories" ADD CONSTRAINT "_PackageCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageFaqCategories" ADD CONSTRAINT "_PackageFaqCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageFaqCategories" ADD CONSTRAINT "_PackageFaqCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogAuthors" ADD CONSTRAINT "_BlogAuthors_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogAuthors" ADD CONSTRAINT "_BlogAuthors_B_fkey" FOREIGN KEY ("B") REFERENCES "blog_authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogCategories" ADD CONSTRAINT "_BlogCategories_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogCategories" ADD CONSTRAINT "_BlogCategories_B_fkey" FOREIGN KEY ("B") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogTags" ADD CONSTRAINT "_BlogTags_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogTags" ADD CONSTRAINT "_BlogTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPlaces" ADD CONSTRAINT "_BlogPlaces_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BlogPlaces" ADD CONSTRAINT "_BlogPlaces_B_fkey" FOREIGN KEY ("B") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageFaqs" ADD CONSTRAINT "_PackageFaqs_A_fkey" FOREIGN KEY ("A") REFERENCES "faqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageFaqs" ADD CONSTRAINT "_PackageFaqs_B_fkey" FOREIGN KEY ("B") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageGroupFaqs" ADD CONSTRAINT "_PackageGroupFaqs_A_fkey" FOREIGN KEY ("A") REFERENCES "group_faqs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageGroupFaqs" ADD CONSTRAINT "_PackageGroupFaqs_B_fkey" FOREIGN KEY ("B") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMemberTestimonials" ADD CONSTRAINT "_TeamMemberTestimonials_A_fkey" FOREIGN KEY ("A") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMemberTestimonials" ADD CONSTRAINT "_TeamMemberTestimonials_B_fkey" FOREIGN KEY ("B") REFERENCES "testimonials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackagePlaces" ADD CONSTRAINT "_PackagePlaces_A_fkey" FOREIGN KEY ("A") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackagePlaces" ADD CONSTRAINT "_PackagePlaces_B_fkey" FOREIGN KEY ("B") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageTripInfos" ADD CONSTRAINT "_PackageTripInfos_A_fkey" FOREIGN KEY ("A") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageTripInfos" ADD CONSTRAINT "_PackageTripInfos_B_fkey" FOREIGN KEY ("B") REFERENCES "trip_infos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageTestimonials" ADD CONSTRAINT "_PackageTestimonials_A_fkey" FOREIGN KEY ("A") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageTestimonials" ADD CONSTRAINT "_PackageTestimonials_B_fkey" FOREIGN KEY ("B") REFERENCES "testimonials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCustomRelated" ADD CONSTRAINT "_PackageCustomRelated_A_fkey" FOREIGN KEY ("A") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PackageCustomRelated" ADD CONSTRAINT "_PackageCustomRelated_B_fkey" FOREIGN KEY ("B") REFERENCES "packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryAuthors" ADD CONSTRAINT "_StoryAuthors_A_fkey" FOREIGN KEY ("A") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryAuthors" ADD CONSTRAINT "_StoryAuthors_B_fkey" FOREIGN KEY ("B") REFERENCES "story_authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ===== Seed rows that the application expects to exist =====

INSERT INTO "service_section_configs" (
    "id", "eyebrow", "heading", "introduction", "createdAt", "updatedAt"
) VALUES (
    'homepage-services',
    'Services',
    'Everything We Take Care of',
    'From the first email to the final descent, every part of your journey is planned, permitted, and personally guided.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

-- Preserve the existing homepage card as managed content immediately after
-- deployment. The seed script uses the same stable id, so both paths are
-- idempotent.
INSERT INTO "services" (
    "id", "title", "description", "secondaryDescription", "imageUrl",
    "ctaLabel", "ctaUrl", "sortOrder", "isActive", "createdAt", "updatedAt"
) VALUES (
    'service-adventure-tourism',
    'Adventure Tourism',
    'Spectacular trekking experiences to iconic destinations like Everest Base Camp and Annapurna Circuit, as well as off-the-beaten-path adventures. Expert guides, top-notch equipment, and meticulous planning ensure unforgettable and safe hiking experiences in the Himalayas.',
    'Spectacular trekking experiences to iconic destinations like Everest Base Camp and Annapurna Circuit, as well as off-the-beaten-path adventures. Expert guides, top-notch equipment, and meticulous planning ensure unforgettable and safe hiking experiences in the Himalayas.',
    '/images/services/adventure-tourism.jpg',
    'Know More',
    '/about-us',
    1,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT ("id") DO NOTHING;

-- Make the new permission subject available to role management without
-- requiring a separate seed command after a production migration.
INSERT INTO "permissions" ("id", "action", "subject", "name") VALUES
    ('permission-service-create', 'create', 'service', 'create:service'),
    ('permission-service-read', 'read', 'service', 'read:service'),
    ('permission-service-update', 'update', 'service', 'update:service'),
    ('permission-service-delete', 'delete', 'service', 'delete:service')
ON CONFLICT ("action", "subject") DO NOTHING;

-- ===== Booking numbers shown to customers start above 1443 (client request) =====
ALTER SEQUENCE "bookings_bookingNumber_seq" RESTART WITH 1444;

-- ===== Database-level integrity rules for the B2B module =====
-- ===== Invariants enforced in the database as the last line of defence =====
-- (the application serializes writers with row locks; these make a bug fail loudly instead of corrupting inventory)

ALTER TABLE "package_departures"
  ADD CONSTRAINT "package_departures_seats_nonneg_chk" CHECK ("bookedSeats" >= 0 AND "heldSeats" >= 0 AND "cutoffHours" >= 0),
  ADD CONSTRAINT "package_departures_capacity_chk" CHECK ("totalSeats" IS NULL OR ("totalSeats" >= 0 AND "bookedSeats" + "heldSeats" <= "totalSeats"));

ALTER TABLE "b2b_inventory_allotments"
  ADD CONSTRAINT "b2b_allotments_seats_chk" CHECK ("allocatedSeats" >= 0 AND "bookedSeats" >= 0 AND "heldSeats" >= 0 AND "allocatedSeats" >= "bookedSeats" + "heldSeats" AND "releaseBeforeHours" >= 0);

ALTER TABLE "b2b_inventory_holds"
  ADD CONSTRAINT "b2b_holds_seats_chk" CHECK ("seatsHeld" > 0),
  ADD CONSTRAINT "b2b_holds_status_chk" CHECK ("status" IN ('ACTIVE', 'CONVERTED', 'EXPIRED', 'RELEASED'));

ALTER TABLE "b2b_partner_contracts"
  ADD CONSTRAINT "b2b_contracts_dates_chk" CHECK ("validTo" >= "validFrom"),
  ADD CONSTRAINT "b2b_contracts_pax_chk" CHECK (("minPax" IS NULL OR "minPax" >= 1) AND ("maxPax" IS NULL OR "maxPax" >= 1) AND ("minPax" IS NULL OR "maxPax" IS NULL OR "minPax" <= "maxPax")),
  ADD CONSTRAINT "b2b_contracts_price_chk" CHECK (("netUnitPrice" IS NULL OR "netUnitPrice" >= 0) AND ("commissionPct" IS NULL OR ("commissionPct" >= 0 AND "commissionPct" <= 100)) AND ("rateType" <> 'NET' OR "netUnitPrice" IS NOT NULL) AND "cutoffHours" >= 0);
-- ===== Financial integrity enforced by the database =====

-- Balances can never go negative and credit can never exceed the limit.
ALTER TABLE "b2b_partners"
  ADD CONSTRAINT "b2b_partners_balances_chk" CHECK ("walletBalance" >= 0 AND "creditUsed" >= 0 AND "creditLimit" >= 0 AND "creditUsed" <= "creditLimit");

ALTER TABLE "b2b_ledger_entries"
  ADD CONSTRAINT "b2b_ledger_amount_chk" CHECK ("amount" > 0 AND "balanceAfter" >= 0 AND "creditUsedAfter" >= 0);

-- Idempotency backstop: one posting per (type, account, reference) for keyed entry types.
-- The service checks first under the partner row lock; this index makes a double-post impossible even if it didn't.

-- Immutable ledger: history is corrected only by appending reversing entries.
CREATE FUNCTION b2b_ledger_entries_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'b2b_ledger_entries is append-only (% not allowed)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER b2b_ledger_entries_no_update_delete
  BEFORE UPDATE OR DELETE ON "b2b_ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION b2b_ledger_entries_immutable();
-- ===== Integrity rules =====
ALTER TABLE "b2b_api_keys" ADD CONSTRAINT "b2b_api_keys_rate_chk" CHECK ("rateLimitRpm" >= 1 AND "rateLimitRpm" <= 10000);
ALTER TABLE "b2b_webhook_deliveries"
  ADD CONSTRAINT "b2b_webhook_deliveries_attempts_chk" CHECK ("attemptCount" >= 0 AND "maxAttempts" >= 1),
  ADD CONSTRAINT "b2b_webhook_deliveries_status_chk" CHECK ("status" IN ('PENDING', 'DELIVERED', 'FAILED'));
ALTER TABLE "b2b_sla_tickets" ADD CONSTRAINT "b2b_sla_tickets_priority_chk" CHECK ("priority" IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

-- Settlements post COMMISSION_CREDIT / CREDIT_LINE_REPAYMENT with an optional client reference: extend the
-- ledger idempotency index so a retried settlement can never post twice. Entries without a reference are unaffected.
CREATE UNIQUE INDEX "b2b_ledger_idempotency_key"
  ON "b2b_ledger_entries" ("entryType", "account", "referenceType", "referenceId")
  WHERE "referenceId" IS NOT NULL
    AND "entryType" IN ('WALLET_TOPUP', 'BOOKING_DEBIT', 'CREDIT_LINE_DRAW', 'REFUND_CREDIT', 'COMMISSION_CREDIT', 'CREDIT_LINE_REPAYMENT', 'ADJUSTMENT');
