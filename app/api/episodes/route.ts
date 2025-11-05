import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
<<<<<<< HEAD
import { Prisma } from "@prisma/client";
=======
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
<<<<<<< HEAD
    const publisherId = searchParams.get("publisherId");
    const sentiment = searchParams.get("sentiment");
    const iabCategory = searchParams.get("iabCategory");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

    // Build where clause
    const where: Prisma.EpisodeWhereInput = {};

    // Publisher filter
    if (publisherId) {
      const publisherIdNum = parseInt(publisherId, 10);
      if (!isNaN(publisherIdNum)) {
        where.publisherId = publisherIdNum;
      }
    }

    // Sentiment filter
    if (sentiment) {
      where.sentiment = sentiment;
    }

    // IAB category filter (search in enrichedMetadata JSON array)
    // Note: Prisma JSON filtering for arrays requires a different approach
    // We'll filter in memory after fetching for reliability

    // Date range filters
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const dateToEnd = new Date(dateTo);
        dateToEnd.setHours(23, 59, 59, 999);
        where.createdAt.lte = dateToEnd;
      }
    }

    // Search filter (title search)
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Fetch episodes with filters (excluding IAB category which we'll filter in memory)
    let episodes = await prisma.episode.findMany({
      where,
=======
    const skip = searchParams.get("skip");

    const episodes = await prisma.episode.findMany({
      take: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e
      orderBy: {
        createdAt: "desc",
      },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
<<<<<<< HEAD
            company: true,
=======
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e
          },
        },
      },
    });

<<<<<<< HEAD
    // Filter by IAB category in memory (if specified)
    if (iabCategory) {
      episodes = episodes.filter((episode) => {
        const metadata = episode.enrichedMetadata as any;
        const categories = metadata?.iab_categories || [];
        return categories.includes(iabCategory);
      });
    }

    // Get total count after IAB filtering
    const totalCount = episodes.length;

    // Apply pagination
    const skipValue = parseInt(searchParams.get("skip") || "0", 10);
    const take = limit ? parseInt(limit, 10) : undefined;
    const paginatedEpisodes = take
      ? episodes.slice(skipValue, skipValue + take)
      : episodes.slice(skipValue);

    return NextResponse.json({
      episodes: paginatedEpisodes,
      count: paginatedEpisodes.length,
      totalCount,
=======
    return NextResponse.json({
      episodes,
      count: episodes.length,
>>>>>>> 11ccb6c9451012911cd672ede8ba81d7a497e62e
    });
  } catch (error) {
    console.error("Failed to fetch episodes:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch episodes",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
