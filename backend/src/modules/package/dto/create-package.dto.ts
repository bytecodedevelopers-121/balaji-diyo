import { z } from 'zod';

const CostDetailItemDto = z
  .object({
  // Set when the row belongs to a shared CostCategory — its name is then
  // copied into `detailKey` server-side. `detailKey` alone still works for
  // rows with no category.
  costCategoryId: z.string().optional(),
  detailKey: z.string().min(1).max(100).optional(),
  // Optional now: with a category the row is "that category's rich-text list" (`detailDescription`) and the title is just the category name.
  detailTitle: z.string().max(255).optional(),
  detailDescription: z.string().optional(),
  detailExtra: z.string().optional(),
  })
  .refine((d) => d.costCategoryId || d.detailKey, { message: 'costCategoryId or detailKey is required' })
  .refine((d) => d.detailTitle || d.detailDescription, { message: 'detailTitle or detailDescription is required' });

const PriceGroupItemDto = z.object({
  packageTier: z.string().min(1).max(50),
  minPeople: z.number().int().min(1),
  maxPeople: z.number().int().min(1),
  shortDescription: z.string().max(1500).optional(),
  unitPrice: z.number().min(0),
  offerUnitPrice: z.number().min(0).optional(),
  offerLabel: z.string().max(50).optional(),
  offerInformation: z.string().max(1500).optional(),
  isDefault: z.boolean().optional(),
});

const FactItemDto = z.object({
  factTitle: z.string().min(1).max(255),
  factValue: z.string().min(1).max(255),
});

const AddOnItemDto = z.object({
  addonTitle: z.string().min(1).max(255),
  addonDescription: z.string().optional(),
  addonPrice: z.number().min(0),
  addonUnit: z.string().max(255).optional(),
  chargeBy: z.enum(['PERSON', 'ROOM', 'FLAT']).optional(),
  peoplePerRoom: z.number().int().min(1).max(20).optional(),
});

const TierItemDto = z.object({
  packageTier: z.string().min(1).max(50),
  packageTierAlias: z.string().min(1).max(255),
  packageTierDescription: z.string().min(1).max(2000),
  costIncludes: z.string().optional(),
  costExcludes: z.string().optional(),
  wetravelUuid: z.string().optional(),
});

const ExtraFaqItemDto = z.object({
  question: z.string().min(1).max(255),
  answer: z.string().min(1).max(65535),
});

export const CreatePackageDto = z.object({
  title: z.string().min(5).max(255),
  slug: z.string().min(1).optional(),
  urlTitle: z.string().max(200).optional(),
  canonical: z.string().max(500).optional(),
  abstract: z.string().optional(),
  details: z.string().optional(),
  tripInfoText: z.string().optional(),
  highlights: z.string().optional(),
  costIncludesText: z.string().optional(),
  costExcludesText: z.string().optional(),
  extraFaqs: z.array(ExtraFaqItemDto).optional(),
  // Whole "Gear" tab / Packing List content — a single rich-text field
  // (2026-09-03, direct request: "let's just have a tiptap editor
  // section for this instead of separating into diff categories"),
  // superseding the earlier structured `gearItems` (category + item +
  // optional photo, one row each) approach from the same day. Kept the
  // existing field name/column rather than adding a new one — it was
  // always "the text shown above the checklist"; now it's simply the
  // entire Gear tab's content, checklist included, images embeddable
  // inline via the admin's own RichTextEditor image tool.
  // `PackageGearItem`/`package_gear_items` (the old model/table) is left
  // as-is in the schema, unused — dropping it would mean another schema
  // migration for no functional gain, and it still holds whatever
  // gear items were entered through the admin UI before this change.
  packingListIntro: z.string().optional(),

  price: z.number().min(0),
  duration: z.number().min(0),
  durationType: z.string().min(1).max(20),
  groupSize: z.string().max(20).optional(),
  discount: z.number().min(0).optional(),
  maxAltitude: z.string().max(20).optional(),
  geoLongitude: z.string().optional(),
  geoLatitude: z.string().optional(),
  usefulInfo: z.string().optional(),
  departureNote: z.string().optional(),
  additionalField1: z.string().optional(),
  additionalField2: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  // Admin-editable "Published" date shown on the Packages list — see the
  // matching comment on the Prisma field. Accepts an ISO date/datetime
  // string from the admin's date input; defaults to now() in the DB when
  // omitted on create.
  publishedAt: z.coerce.date().optional(),

  destinationId: z.string().min(1, 'destinationId is required'),
  gradeId: z.string().optional(),
  styleId: z.string().optional(),
  transportationId: z.string().optional(),
  mealsId: z.string().optional(),
  accommodationId: z.string().optional(),

  categoryIds: z.array(z.string()).optional(),
  faqCategoryIds: z.array(z.string()).optional(),
  placeIds: z.array(z.string()).optional(),
  faqIds: z.array(z.string()).optional(),
  groupFaqIds: z.array(z.string()).optional(),
  tripInfoIds: z.array(z.string()).optional(),
  customRelatedIds: z.array(z.string()).optional(),

  costIncludes: z.array(CostDetailItemDto).max(50).optional(),
  costExcludes: z.array(CostDetailItemDto).max(50).optional(),
  priceGroups: z.array(PriceGroupItemDto).max(50).optional(),
  facts: z.array(FactItemDto).optional(),
  addOns: z.array(AddOnItemDto).optional(),
  tiers: z.array(TierItemDto).optional(),

  metaTitle: z.string().max(255).optional(),
  metaKeywords: z.string().max(2000).optional(),
  metaDescription: z.string().max(2000).optional(),
});

export type CreatePackageDtoType = z.infer<typeof CreatePackageDto>;
