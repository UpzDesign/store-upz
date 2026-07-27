ALTER TABLE "Company"
ADD COLUMN "logoType" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN "logoText" TEXT,
ADD COLUMN "logoTextColor" TEXT,
ADD COLUMN "logoFontStyle" TEXT DEFAULT 'sans';
