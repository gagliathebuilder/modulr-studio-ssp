import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db";
import { z } from "zod";
import { validateRSSUrl } from "@/app/lib/rss";

const publisherUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  company: z.string().optional(),
  rssFeeds: z.array(z.string().url("Invalid RSS URL format")).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid publisher ID" },
        { status: 400 }
      );
    }

    const publisher = await prisma.publisher.findUnique({
      where: { id },
      include: {
        episodes: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!publisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(publisher);
  } catch (error) {
    console.error("Failed to fetch publisher:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch publisher",
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
      return NextResponse.json(
        { error: "Invalid publisher ID" },
        { status: 400 }
      );
    }

    // Check if publisher exists
    const existingPublisher = await prisma.publisher.findUnique({
      where: { id },
    });

    if (!existingPublisher) {
      return NextResponse.json(
        { error: "Publisher not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = publisherUpdateSchema.parse(body);

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
    const updateData: {
      name?: string;
      email?: string | null;
      company?: string | null;
      rssFeeds?: any;
    } = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email === "" ? null : validatedData.email;
    }
    if (validatedData.company !== undefined) {
      updateData.company = validatedData.company || null;
    }
    if (validatedData.rssFeeds !== undefined) {
      updateData.rssFeeds = validatedData.rssFeeds;
    }

    const publisher = await prisma.publisher.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(publisher);
  } catch (error) {
    console.error("Failed to update publisher:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to update publisher",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

