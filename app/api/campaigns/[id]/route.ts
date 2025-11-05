import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { TargetingFilters, CampaignMatchMetadata } from "@/app/types/campaign";

const campaignUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  budget: z.number().positive("Budget must be positive").optional(),
  status: z.string().optional(),
  targetingFilters: z
    .object({
      iabCategories: z.array(z.string()).optional(),
      sentiment: z.array(z.string()).optional(),
      minBrandSafetyScore: z.number().optional(),
    })
    .optional(),
  impressions: z.number().int().optional(),
  ctr: z.number().optional(),
});

function calculateSimulatedCpm(
  targetingFilters?: TargetingFilters | null
): number {
  const BASE_CPM = 2.0;
  let cpm = BASE_CPM;

  if (targetingFilters?.iabCategories?.length) {
    cpm += targetingFilters.iabCategories.length * 0.5;
  }

  if (targetingFilters?.sentiment?.length) {
    cpm += 0.3;
  }

  if (targetingFilters?.minBrandSafetyScore) {
    const bonus = Math.max(0, (targetingFilters.minBrandSafetyScore - 7) * 0.1);
    cpm += bonus;
  }

  return Math.min(cpm, 10.0);
}

function matchEpisodesToCampaign(
  campaign: {
    targetingFilters: TargetingFilters | null;
    simulatedCpm: number | null;
  },
  episodes: Array<{
    id: number;
    enrichedMetadata: any;
    sentiment: string | null;
    brandSafetyScore: number | null;
  }>
): Array<{
  episode: any;
  matchMetadata: CampaignMatchMetadata;
}> {
  if (!campaign.targetingFilters) {
    return episodes.map((episode) => ({
      episode,
      matchMetadata: {
        episodeId: episode.id,
        matchScore: 0,
        cpmUplift: 0,
      },
    }));
  }

  const matchingEpisodes = episodes
    .map((episode) => {
      const metadata = episode.enrichedMetadata as any;
      let matches = true;
      let matchScore = 0;
      let cpmUplift = 0;

      // IAB category match
      if (campaign.targetingFilters?.iabCategories?.length) {
        const episodeCategories = metadata?.iab_categories || [];
        const hasMatchingCategory = campaign.targetingFilters.iabCategories.some(
          (cat) => episodeCategories.includes(cat)
        );
        if (!hasMatchingCategory) {
          matches = false;
        } else {
          matchScore += 1;
          cpmUplift += 0.5;
        }
      }

      // Sentiment match
      if (campaign.targetingFilters?.sentiment?.length) {
        if (
          !episode.sentiment ||
          !campaign.targetingFilters.sentiment.includes(episode.sentiment)
        ) {
          matches = false;
        } else {
          matchScore += 1;
          cpmUplift += 0.3;
        }
      }

      // Brand safety threshold
      if (campaign.targetingFilters?.minBrandSafetyScore !== undefined) {
        const score = episode.brandSafetyScore || 0;
        if (score < campaign.targetingFilters.minBrandSafetyScore) {
          matches = false;
        } else {
          matchScore += 1;
          const bonus = Math.max(0, (score - 7) * 0.1);
          cpmUplift += bonus;
        }
      }

      return matches
        ? {
            episode,
            matchMetadata: {
              episodeId: episode.id,
              matchScore,
              cpmUplift: Math.min(cpmUplift, 8.0), // Cap uplift at $8.00
            },
          }
        : null;
    })
    .filter((match): match is NonNullable<typeof match> => match !== null);

  return matchingEpisodes;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    const campaign = await prisma.campaign.findUnique({
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

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Fetch all episodes for matching
    const episodes = await prisma.episode.findMany({
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

    // Match episodes to campaign
    const matchingEpisodes = matchEpisodesToCampaign(
      {
        targetingFilters: campaign.targetingFilters as TargetingFilters | null,
        simulatedCpm: campaign.simulatedCpm,
      },
      episodes
    );

    return NextResponse.json({
      ...campaign,
      matchingEpisodes: matchingEpisodes.map((match) => ({
        ...match.episode,
        matchMetadata: match.matchMetadata,
      })),
      matchCount: matchingEpisodes.length,
    });
  } catch (error) {
    console.error("Failed to fetch campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 });
    }

    // Check if campaign exists
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = campaignUpdateSchema.parse(body);

    const updateData: {
      name?: string;
      budget?: number;
      status?: string;
      targetingFilters?: TargetingFilters | null;
      simulatedCpm?: number;
      impressions?: number;
      ctr?: number;
    } = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.budget !== undefined) {
      updateData.budget = validatedData.budget;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    if (validatedData.impressions !== undefined) {
      updateData.impressions = validatedData.impressions;
    }
    if (validatedData.ctr !== undefined) {
      updateData.ctr = validatedData.ctr;
    }

    // Recalculate simulatedCpm if targetingFilters or budget changes
    if (
      validatedData.targetingFilters !== undefined ||
      validatedData.budget !== undefined
    ) {
      const targetingFilters =
        validatedData.targetingFilters !== undefined
          ? validatedData.targetingFilters
          : (existingCampaign.targetingFilters as TargetingFilters | null);
      updateData.targetingFilters = targetingFilters ? (targetingFilters as any) : Prisma.JsonNull;
      updateData.simulatedCpm = calculateSimulatedCpm(targetingFilters);
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData as any,
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

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Failed to update campaign:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

