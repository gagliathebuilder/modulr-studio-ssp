import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { formatPrebidExt } from "@/app/lib/formatters/prebid";
import { formatGAMKVs } from "@/app/lib/formatters/gam";
import { z } from "zod";

const bulkExportSchema = z.object({
  episodeIds: z.array(z.number().int().positive()).min(1, "At least one episode ID required"),
  format: z.enum(["json", "csv", "prebid", "gam"]).default("json"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { episodeIds, format } = bulkExportSchema.parse(body);

    // Fetch episodes
    const episodes = await prisma.episode.findMany({
      where: {
        id: {
          in: episodeIds,
        },
      },
      include: {
        publisher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (episodes.length === 0) {
      return NextResponse.json(
        { error: "No episodes found" },
        { status: 404 }
      );
    }

    // Format based on requested format
    switch (format) {
      case "prebid": {
        const prebidExports = episodes.map((episode) => ({
          episodeId: episode.id,
          episodeTitle: episode.title,
          ...formatPrebidExt(episode),
        }));
        return NextResponse.json(prebidExports, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="episodes-prebid-${Date.now()}.json"`,
          },
        });
      }

      case "gam": {
        const gamExports = episodes.map((episode) => ({
          episodeId: episode.id,
          episodeTitle: episode.title,
          ...formatGAMKVs(episode),
        }));
        return NextResponse.json(gamExports, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="episodes-gam-${Date.now()}.json"`,
          },
        });
      }

      case "csv": {
        const headers = [
          "Episode ID",
          "Title",
          "Publisher",
          "IAB Categories",
          "Sentiment",
          "Brand Safety Score",
          "Contextual Segments",
          "Topics",
          "Entities",
          "Ad Breaks",
        ];

        const rows = episodes.map((episode) => {
          const metadata = episode.enrichedMetadata as any;
          const adBreaks = episode.adBreaks as any;

          return [
            episode.id.toString(),
            episode.title || "",
            episode.publisher?.name || "",
            (metadata?.iab_categories || []).join("; "),
            episode.sentiment || "",
            episode.brandSafetyScore?.toString() || "",
            (metadata?.contextual_segments || []).join("; "),
            (metadata?.topics || []).join("; "),
            (metadata?.entities || []).join("; "),
            adBreaks && Array.isArray(adBreaks)
              ? adBreaks
                  .map(
                    (b: any) =>
                      `${b.id || "break"}:${b.startTime}s/${b.maxDuration}s`
                  )
                  .join("; ")
              : "",
          ];
        });

        const csvContent = [
          headers.join(","),
          ...rows.map((row) =>
            row.map((cell: string) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
          ),
        ].join("\n");

        return new NextResponse(csvContent, {
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="episodes-export-${Date.now()}.csv"`,
          },
        });
      }

      case "json":
      default: {
        const jsonExports = episodes.map((episode) => {
          const metadata = episode.enrichedMetadata as any;
          const adBreaks = episode.adBreaks as any;

          return {
            id: episode.id,
            title: episode.title,
            publisher: {
              id: episode.publisher.id,
              name: episode.publisher.name,
            },
            rssUrl: episode.rssUrl,
            transcript: episode.transcript,
            enrichedMetadata: metadata,
            brandSafetyScore: episode.brandSafetyScore,
            sentiment: episode.sentiment,
            contextualScore: episode.contextualScore,
            adBreaks: adBreaks || [],
            createdAt: episode.createdAt.toISOString(),
            prebidExt: formatPrebidExt(episode),
            gamKVs: formatGAMKVs(episode),
          };
        });

        return NextResponse.json(jsonExports, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="episodes-export-${Date.now()}.json"`,
          },
        });
      }
    }
  } catch (error) {
    console.error("Bulk export error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to export episodes",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

