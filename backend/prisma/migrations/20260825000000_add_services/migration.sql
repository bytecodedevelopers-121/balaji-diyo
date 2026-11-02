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

CREATE INDEX "services_isActive_sortOrder_idx" ON "services"("isActive", "sortOrder");

CREATE TABLE "service_section_configs" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "introduction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_section_configs_pkey" PRIMARY KEY ("id")
);

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
