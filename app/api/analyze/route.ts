import { NextResponse } from "next/server";
import { analyzeEpisode } from "@/app/lib/openai";
import { prisma } from "@/app/lib/db";
import { z } from "zod";

const analyzeRequestSchema = z.object({
  url: z.string().optional(),
  transcript: z.string().optional(),
  title: z.string().optional(),
}).refine((data) => data.url || data.transcript, {
  message: "Either 'url' or 'transcript' is required",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, transcript, title } = analyzeRequestSchema.parse(body);

    // Validate URL if provided
    if (url && url.trim() !== "" && !url.match(/^https?:\/\/.+/)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Prepare input for analysis
    const input = transcript || `Analyze podcast episode at ${url}`;

    // Analyze with OpenAI
    const analysis = await analyzeEpisode(input, title);

    // Get or create a default publisher (for MVP)
    let defaultPublisher = await prisma.publisher.findFirst({
      where: { name: "Default Publisher" },
    });

    if (!defaultPublisher) {
      defaultPublisher = await prisma.publisher.create({
        data: {
          name: "Default Publisher",
          email: null,
        },
      });
    }

    // Store enriched metadata as JSON
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

    // Save to database
    const episode = await prisma.episode.create({
      data: {
        title: title || "Untitled Episode",
        rssUrl: url || null,
        transcript: transcript || null,
        enrichedMetadata: enrichedMetadata,
        brandSafetyScore: analysis.brand_safety_score,
        sentiment: analysis.sentiment,
        contextualScore: null, // Not in our analysis yet
        publisherId: defaultPublisher.id,
      },
    });

    return NextResponse.json({
      id: episode.id,
      ...analysis,
      analyzedAt: episode.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Analysis error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to analyze episode",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
