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

-- CreateIndex
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "travel_guides_slug_key" ON "travel_guides"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "travel_guide_topics_guideId_slug_key" ON "travel_guide_topics"("guideId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "web_stories_slug_key" ON "web_stories"("slug");

-- AddForeignKey
ALTER TABLE "travel_guide_topics" ADD CONSTRAINT "travel_guide_topics_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "travel_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
