import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { formatPrebidExt } from "@/app/lib/formatters/prebid";

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
    });

    if (!episode) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    const prebidExt = formatPrebidExt(episode);

    return NextResponse.json(prebidExt, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Failed to export Prebid ext:", error);
    return NextResponse.json(
      {
        error: "Failed to export Prebid extension",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

