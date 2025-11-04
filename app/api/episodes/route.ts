import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit");
    const skip = searchParams.get("skip");

    const episodes = await prisma.episode.findMany({
      take: limit ? parseInt(limit, 10) : undefined,
      skip: skip ? parseInt(skip, 10) : undefined,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      episodes,
      count: episodes.length,
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
