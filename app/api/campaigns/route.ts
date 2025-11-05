import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { TargetingFilters } from "@/app/types/campaign";

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  budget: z.number().positive("Budget must be positive"),
  publisherId: z.number().int("Publisher ID must be an integer"),
  status: z.string().optional().default("active"),
  targetingFilters: z
    .object({
      iabCategories: z.array(z.string()).optional(),
      sentiment: z.array(z.string()).optional(),
      minBrandSafetyScore: z.number().optional(),
    })
    .optional(),
  impressions: z.number().int().optional().default(0),
  ctr: z.number().optional().default(0),
});

function calculateSimulatedCpm(
  targetingFilters?: TargetingFilters | null
): number {
  const BASE_CPM = 2.0;
  let cpm = BASE_CPM;

  // IAB category match bonus: +$0.50 per category
  if (targetingFilters?.iabCategories?.length) {
    cpm += targetingFilters.iabCategories.length * 0.5;
  }

  // Sentiment match bonus: +$0.30
  if (targetingFilters?.sentiment?.length) {
    cpm += 0.3;
  }

  // Brand safety bonus: +$0.10 per point above 7
  if (targetingFilters?.minBrandSafetyScore) {
    const bonus = Math.max(0, (targetingFilters.minBrandSafetyScore - 7) * 0.1);
    cpm += bonus;
  }

  // Cap at $10.00
  return Math.min(cpm, 10.0);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const publisherIdParam = searchParams.get("publisherId");

    const where: { publisherId?: number } = {};
    if (publisherIdParam) {
      const publisherId = parseInt(publisherIdParam, 10);
      if (!isNaN(publisherId)) {
        where.publisherId = publisherId;
      }
    }

    const campaigns = await prisma.campaign.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error("Failed to fetch campaigns:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch campaigns",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = campaignSchema.parse(body);

    // Verify publisher exists
    const publisher = await prisma.publisher.findUnique({
      where: { id: validatedData.publisherId },
    });

    if (!publisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 }
      );
    }

    // Calculate simulated CPM
    const simulatedCpm = calculateSimulatedCpm(validatedData.targetingFilters);

    const campaign = await prisma.campaign.create({
      data: {
        name: validatedData.name,
        budget: validatedData.budget,
        publisherId: validatedData.publisherId,
        status: validatedData.status,
        targetingFilters: validatedData.targetingFilters ? (validatedData.targetingFilters as any) : Prisma.JsonNull,
        simulatedCpm,
        impressions: validatedData.impressions,
        ctr: validatedData.ctr,
      },
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

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Failed to create campaign:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create campaign",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

