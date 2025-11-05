import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { parseRSSFeed, validateRSSUrl } from "@/app/lib/rss";
import { z } from "zod";

const ingestRequestSchema = z.object({
  publisherId: z.number().int().positive("Publisher ID must be a positive integer"),
  rssUrl: z.string().url("Invalid RSS URL format"),
  autoAnalyze: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { publisherId, rssUrl, autoAnalyze } = ingestRequestSchema.parse(body);

    // Validate RSS URL format
    if (!validateRSSUrl(rssUrl)) {
      return NextResponse.json(
        { error: "Invalid RSS URL format" },
        { status: 400 }
      );
    }

    // Check if publisher exists
    const publisher = await prisma.publisher.findUnique({
      where: { id: publisherId },
    });

    if (!publisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 }
      );
    }

    // Parse RSS feed
    const feed = await parseRSSFeed(rssUrl);

    const createdEpisodes: any[] = [];
    const skippedEpisodes: any[] = [];

    // Process each episode from the feed
    for (const rssEpisode of feed.episodes) {
      // Check if episode already exists (by GUID or title + publish date)
      const existingEpisode = await prisma.episode.findFirst({
        where: {
          publisherId,
          OR: [
            { rssUrl: rssEpisode.guid || rssEpisode.link },
            ...(rssEpisode.publishDate
              ? [
                  {
                    title: rssEpisode.title,
                    createdAt: {
                      gte: new Date(rssEpisode.publishDate.getTime() - 24 * 60 * 60 * 1000),
                      lte: new Date(rssEpisode.publishDate.getTime() + 24 * 60 * 60 * 1000),
                    },
                  },
                ]
              : []),
          ],
        },
      });

      if (existingEpisode) {
        skippedEpisodes.push({
          title: rssEpisode.title,
          reason: "Episode already exists",
        });
        continue;
      }

      // Create episode record
      const episode = await prisma.episode.create({
        data: {
          title: rssEpisode.title,
          rssUrl: rssEpisode.guid || rssEpisode.link || rssUrl,
          transcript: rssEpisode.description || null,
          publisherId,
          createdAt: rssEpisode.publishDate || new Date(),
        },
      });

      createdEpisodes.push({
        id: episode.id,
        title: episode.title,
      });

      // Optionally trigger auto-analysis
      if (autoAnalyze && rssEpisode.description) {
        try {
          // Import analyzeEpisode function
          const { analyzeEpisode } = await import("@/app/lib/openai");

          const analysis = await analyzeEpisode(
            rssEpisode.description,
            rssEpisode.title
          );

          const enrichedMetadata = {
            summary: analysis.summary,
            topics: analysis.topics,
            entities: analysis.entities,
            tone: analysis.tone,
            sentiment: analysis.sentiment,
            brand_safety_score: analysis.brand_safety_score,
            iab_categories: analysis.iab_categories,
            contextual_segments: analysis.contextual_segments,
          };

          await prisma.episode.update({
            where: { id: episode.id },
            data: {
              enrichedMetadata,
              brandSafetyScore: analysis.brand_safety_score,
              sentiment: analysis.sentiment,
            },
          });
        } catch (analysisError) {
          console.error(`Failed to analyze episode ${episode.id}:`, analysisError);
          // Continue even if analysis fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      feedTitle: feed.title,
      created: createdEpisodes.length,
      skipped: skippedEpisodes.length,
      createdEpisodes,
      skippedEpisodes,
    });
  } catch (error) {
    console.error("RSS ingestion error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to ingest RSS feed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

