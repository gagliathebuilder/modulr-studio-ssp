import { Episode } from "@prisma/client";

export interface PrebidExt {
  ext: {
    modulr: {
      iab_categories?: string[];
      sentiment?: string;
      brand_safety_score?: number;
      contextual_segments?: string[];
      topics?: string[];
      entities?: string[];
      adBreaks?: Array<{
        id: string;
        startTime: number;
        maxDuration: number;
      }>;
    };
  };
}

/**
 * Formats episode metadata into Prebid ORTB ext.modulr format
 * @param episode - Episode record from database
 * @returns Prebid extension object compatible with ORTB 2.5+
 */
export function formatPrebidExt(episode: Episode): PrebidExt {
  const metadata = episode.enrichedMetadata as any;
  const adBreaks = episode.adBreaks as any;

  const modulr: PrebidExt["ext"]["modulr"] = {};

  // IAB Categories
  if (metadata?.iab_categories && Array.isArray(metadata.iab_categories)) {
    modulr.iab_categories = metadata.iab_categories;
  }

  // Sentiment
  if (episode.sentiment) {
    modulr.sentiment = episode.sentiment;
  }

  // Brand Safety Score
  if (episode.brandSafetyScore !== null && episode.brandSafetyScore !== undefined) {
    modulr.brand_safety_score = episode.brandSafetyScore;
  }

  // Contextual Segments
  if (metadata?.contextual_segments && Array.isArray(metadata.contextual_segments)) {
    modulr.contextual_segments = metadata.contextual_segments;
  }

  // Topics
  if (metadata?.topics && Array.isArray(metadata.topics)) {
    modulr.topics = metadata.topics;
  }

  // Entities
  if (metadata?.entities && Array.isArray(metadata.entities)) {
    modulr.entities = metadata.entities;
  }

  // Ad Breaks
  if (adBreaks && Array.isArray(adBreaks) && adBreaks.length > 0) {
    modulr.adBreaks = adBreaks.map((breakItem: any) => ({
      id: breakItem.id || `break-${breakItem.startTime}`,
      startTime: typeof breakItem.startTime === "number" ? breakItem.startTime : 0,
      maxDuration:
        typeof breakItem.maxDuration === "number" ? breakItem.maxDuration : 30,
    }));
  }

  return {
    ext: {
      modulr,
    },
  };
}

