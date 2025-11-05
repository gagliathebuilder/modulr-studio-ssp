import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { z } from "zod";
import { validateRSSUrl } from "@/app/lib/rss";

const publisherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  company: z.string().optional(),
  rssFeeds: z.array(z.string().url("Invalid RSS URL format")).optional(),
});

export async function GET(req: Request) {
  try {
    const publishers = await prisma.publisher.findMany({
      include: {
        _count: {
          select: {
            episodes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      publishers,
      count: publishers.length,
    });
  } catch (error) {
    console.error("Failed to fetch publishers:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch publishers",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = publisherSchema.parse(body);

    // Validate RSS URLs if provided
    if (validatedData.rssFeeds && validatedData.rssFeeds.length > 0) {
      for (const url of validatedData.rssFeeds) {
        if (!validateRSSUrl(url)) {
          return NextResponse.json(
            { error: `Invalid RSS URL format: ${url}` },
            { status: 400 }
          );
        }
      }
    }

    // Convert empty string to null for optional fields
    const publisherData: {
      name: string;
      email: string | null;
      company: string | null;
      rssFeeds?: any;
    } = {
      name: validatedData.name,
      email: validatedData.email === "" || validatedData.email === undefined ? null : validatedData.email,
      company: validatedData.company || null,
    };

    // Store RSS feeds as JSON array
    publisherData.rssFeeds = validatedData.rssFeeds || [];

    const publisher = await prisma.publisher.create({
      data: publisherData,
    });

    return NextResponse.json(publisher, { status: 201 });
  } catch (error) {
    console.error("Failed to create publisher:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create publisher",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

