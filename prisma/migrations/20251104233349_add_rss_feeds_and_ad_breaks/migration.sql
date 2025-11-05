-- AlterTable
ALTER TABLE "Episode" ADD COLUMN     "adBreaks" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "Publisher" ADD COLUMN     "rssFeeds" JSONB DEFAULT '[]';
