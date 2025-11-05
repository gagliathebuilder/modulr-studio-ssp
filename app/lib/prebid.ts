import { prisma } from "@/app/lib/db";
import { formatPrebidExt } from "@/app/lib/formatters/prebid";

export interface ORTBRequest {
  id?: string;
  imp?: Array<{
    id?: string;
    ext?: any;
  }>;
  ext?: any;
  [key: string]: any;
}

export interface ORTBResponse {
  id?: string;
  seatbid?: Array<{
    bid?: Array<{
      id?: string;
      impid?: string;
      price?: number;
      adm?: string;
      ext?: any;
    }>;
  }>;
  ext?: any;
  [key: string]: any;
}

/**
 * Injects Modulr metadata into an ORTB bid request
 * @param bidRequest - The ORTB bid request object
 * @param episodeId - The episode ID to fetch metadata for
 * @returns The bid request with Modulr metadata injected
 */
export async function injectModulrMetadata(
  bidRequest: ORTBRequest,
  episodeId: number
): Promise<ORTBRequest> {
  try {
    // Fetch episode from database
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    // Format episode metadata into Prebid ext format
    const modulrExt = formatPrebidExt(episode);

    // Clone the bid request to avoid mutating the original
    const enhancedRequest: ORTBRequest = JSON.parse(JSON.stringify(bidRequest));

    // Initialize ext if it doesn't exist
    if (!enhancedRequest.ext) {
      enhancedRequest.ext = {};
    }

    // Merge Modulr metadata into ext
    enhancedRequest.ext.modulr = modulrExt.ext.modulr;

    // Also inject into each impression's ext if impressions exist
    if (enhancedRequest.imp && Array.isArray(enhancedRequest.imp)) {
      enhancedRequest.imp = enhancedRequest.imp.map((imp) => {
        if (!imp.ext) {
          imp.ext = {};
        }
        imp.ext.modulr = modulrExt.ext.modulr;
        return imp;
      });
    }

    return enhancedRequest;
  } catch (error) {
    console.error(`Failed to inject Modulr metadata for episode ${episodeId}:`, error);
    throw error;
  }
}

/**
 * Extracts episode ID from bid request
 * Can be passed via:
 * - ext.modulr.episodeId
 * - Custom query parameter
 * - URL path parameter
 */
export function extractEpisodeIdFromRequest(
  bidRequest: ORTBRequest,
  queryParams?: URLSearchParams
): number | null {
  // Try from bid request ext
  if (bidRequest.ext?.modulr?.episodeId) {
    const episodeId = parseInt(String(bidRequest.ext.modulr.episodeId), 10);
    if (!isNaN(episodeId)) {
      return episodeId;
    }
  }

  // Try from query parameters
  if (queryParams) {
    const episodeIdParam = queryParams.get("episodeId");
    if (episodeIdParam) {
      const episodeId = parseInt(episodeIdParam, 10);
      if (!isNaN(episodeId)) {
        return episodeId;
      }
    }
  }

  return null;
}

