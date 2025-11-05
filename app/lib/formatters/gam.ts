import { Episode } from "@prisma/client";

export interface GAMKeyValues {
  [key: string]: string;
}

/**
 * Formats episode metadata into GAM-compatible key-value pairs
 * @param episode - Episode record from database
 * @returns Object with GAM key-value pairs
 */
export function formatGAMKVs(episode: Episode): GAMKeyValues {
  const metadata = episode.enrichedMetadata as any;
  const adBreaks = episode.adBreaks as any;
  const kvs: GAMKeyValues = {};

  // IAB Categories (comma-separated)
  if (metadata?.iab_categories && Array.isArray(metadata.iab_categories)) {
    kvs.modulr_iab_cat = metadata.iab_categories.join(",");
  }

  // Sentiment
  if (episode.sentiment) {
    kvs.modulr_sentiment = episode.sentiment;
  }

  // Brand Safety Score
  if (episode.brandSafetyScore !== null && episode.brandSafetyScore !== undefined) {
    kvs.modulr_brand_safety = episode.brandSafetyScore.toString();
  }

  // Contextual Segments (comma-separated)
  if (metadata?.contextual_segments && Array.isArray(metadata.contextual_segments)) {
    kvs.modulr_segments = metadata.contextual_segments.join(",");
  }

  // Topics (comma-separated, truncated if too long)
  if (metadata?.topics && Array.isArray(metadata.topics)) {
    const topicsStr = metadata.topics.join(",");
    // GAM has a limit on KV value length (typically 500 chars)
    kvs.modulr_topics = topicsStr.length > 500 ? topicsStr.substring(0, 497) + "..." : topicsStr;
  }

  // Entities (comma-separated, truncated if too long)
  if (metadata?.entities && Array.isArray(metadata.entities)) {
    const entitiesStr = metadata.entities.join(",");
    kvs.modulr_entities =
      entitiesStr.length > 500 ? entitiesStr.substring(0, 497) + "..." : entitiesStr;
  }

  // Ad Breaks (flattened as ad_0_start, ad_0_maxdur, ad_1_start, etc.)
  if (adBreaks && Array.isArray(adBreaks) && adBreaks.length > 0) {
    adBreaks.forEach((breakItem: any, index: number) => {
      if (breakItem.startTime !== undefined) {
        kvs[`ad_${index}_start`] = String(breakItem.startTime);
      }
      if (breakItem.maxDuration !== undefined) {
        kvs[`ad_${index}_maxdur`] = String(breakItem.maxDuration);
      }
      if (breakItem.id) {
        kvs[`ad_${index}_id`] = String(breakItem.id);
      }
    });
  }

  return kvs;
}

