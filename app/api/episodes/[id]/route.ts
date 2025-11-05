import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { z } from "zod";

const adBreakSchema = z.object({
  id: z.string().optional(),
  startTime: z.number().min(0, "Start time must be >= 0"),
  maxDuration: z.number().min(0, "Max duration must be >= 0"),
});

const episodeUpdateSchema = z.object({
  adBreaks: z.array(adBreakSchema).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid episode ID" },
        { status: 400 }
      );
    }

    const episode = await prisma.episode.findUnique({
      where: { id },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
    });

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(episode);
  } catch (error) {
    console.error("Failed to fetch episode:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch episode",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = parseInt(resolvedParams.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid episode ID" },
        { status: 400 }
      );
    }

    // Check if episode exists
    const existingEpisode = await prisma.episode.findUnique({
      where: { id },
    });

    if (!existingEpisode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = episodeUpdateSchema.parse(body);

    const updateData: {
      adBreaks?: any;
    } = {};

    if (validatedData.adBreaks !== undefined) {
      // Validate ad breaks structure
      const validatedAdBreaks = validatedData.adBreaks.map((breakItem, index) => ({
        id: breakItem.id || `break-${index}`,
        startTime: breakItem.startTime,
        maxDuration: breakItem.maxDuration,
      }));
      updateData.adBreaks = validatedAdBreaks;
    }

    const episode = await prisma.episode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(episode);
  } catch (error) {
    console.error("Failed to update episode:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update episode",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

