-- CreateTable
CREATE TABLE "publishers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publishers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "url" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "entities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tone" TEXT,
    "sentiment" TEXT,
    "brand_safety_score" INTEGER,
    "iab_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contextual_segments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "publisher_id" TEXT,
    "analyzed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "publishers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
