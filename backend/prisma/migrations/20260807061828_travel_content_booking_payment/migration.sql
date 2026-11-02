/*
  Warnings:

  - You are about to drop the column `name` on the `categories` table. All the data in the column will be lost.
  - Added the required column `title` to the `categories` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CostDetailType" AS ENUM ('INCLUDE', 'EXCLUDE');

-- CreateEnum
CREATE TYPE "PaymentGateway" AS ENUM ('NABIL', 'HBL', 'NICA', 'PACO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "AttachmentRole" ADD VALUE 'MAP';

-- DropForeignKey
ALTER TABLE "global_settings" DROP CONSTRAINT "global_settings_categoryId_fkey";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "name",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "extraField1" TEXT,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "global_settings" ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isProtected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "keyGroup" TEXT,
ALTER COLUMN "categoryId" DROP NOT NULL;

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
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "positionOrder" INTEGER NOT NULL DEFAULT 0,
    "salutation" TEXT,
    "fullName" TEXT NOT NULL,
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
CREATE TABLE "package_cost_details" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
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
CREATE TABLE "package_addons" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "addonTitle" TEXT NOT NULL,
    "addonDescription" TEXT,
    "addonPrice" DECIMAL(12,2) NOT NULL,
    "addonUnit" TEXT,
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
    "itineraryDay" TEXT NOT NULL,
    "itineraryTitle" TEXT,
    "itineraryShortDescription" TEXT,
    "itineraryDescription" TEXT,
    "itineraryStop" DECIMAL(6,2),
    "accommodation" TEXT,
    "meals" TEXT,
    "origin" TEXT,
    "originCoordinate" TEXT,
    "originElevation" TEXT,
    "destination" TEXT,
    "destinationCoordinate" TEXT,
    "destinationElevation" TEXT,
    "travelMode" TEXT,
    "distance" TEXT,
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
    "customTitle" TEXT,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "description" TEXT,
    "percentage" INTEGER,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gatewayReference" TEXT,
    "gatewayTransactionId" TEXT,
    "gatewaySignature" TEXT,
    "gatewaySessionId" TEXT,
    "requestPayload" JSONB,
    "responsePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_authors_email_key" ON "blog_authors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "itineraries_packageId_key" ON "itineraries"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "story_authors_email_key" ON "story_authors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_bookingId_key" ON "invoices"("bookingId");

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
ALTER TABLE "global_settings" ADD CONSTRAINT "global_settings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "global_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_comments" ADD CONSTRAINT "blog_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "package_cost_details" ADD CONSTRAINT "package_cost_details_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_price_groups" ADD CONSTRAINT "package_price_groups_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_facts" ADD CONSTRAINT "package_facts_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "itinerary_facts" ADD CONSTRAINT "itinerary_facts_detailId_fkey" FOREIGN KEY ("detailId") REFERENCES "itinerary_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "travellers" ADD CONSTRAINT "travellers_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_bookings" ADD CONSTRAINT "custom_bookings_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_travellers" ADD CONSTRAINT "custom_travellers_customBookingId_fkey" FOREIGN KEY ("customBookingId") REFERENCES "custom_bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
