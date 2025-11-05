import { NextResponse } from "next/server";
import { injectModulrMetadata, extractEpisodeIdFromRequest, ORTBRequest } from "@/app/lib/prebid";

const PREBID_SERVER_URL =
  process.env.PREBID_SERVER_URL || "http://localhost:8000/openrtb2/auction";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bidRequest = body as ORTBRequest;

    // Extract episode ID from request or query params
    const url = new URL(req.url);
    const episodeId = extractEpisodeIdFromRequest(bidRequest, url.searchParams);

    let enhancedRequest = bidRequest;

    // Inject Modulr metadata if episode ID is provided
    if (episodeId !== null) {
      try {
        enhancedRequest = await injectModulrMetadata(bidRequest, episodeId);
      } catch (error) {
        console.error("Failed to inject Modulr metadata:", error);
        // Continue without metadata injection if it fails
      }
    }

    // Forward enhanced bid request to Prebid Server
    const prebidResponse = await fetch(PREBID_SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-openrtb-version": "2.5",
      },
      body: JSON.stringify(enhancedRequest),
    });

    if (!prebidResponse.ok) {
      const errorText = await prebidResponse.text();
      console.error("Prebid Server error:", errorText);
      return NextResponse.json(
        {
          error: "Prebid Server request failed",
          message: errorText,
        },
        { status: prebidResponse.status }
      );
    }

    const bidResponse = await prebidResponse.json();

    return NextResponse.json(bidResponse, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Prebid proxy error:", error);
    return NextResponse.json(
      {
        error: "Failed to process bid request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

