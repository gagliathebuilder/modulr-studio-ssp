import { prisma } from "@/app/lib/db";
import { formatGAMKVs } from "@/app/lib/formatters/gam";

export interface GAMConfig {
  networkCode: string;
  apiKey?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
}

export interface GAMSyncResult {
  success: boolean;
  episodeId: number;
  kvCount: number;
  error?: string;
}

/**
 * Syncs episode metadata to GAM as key-value pairs
 * Note: This is a basic implementation. Full GAM API integration requires:
 * - OAuth2 authentication
 * - GAM API client library
 * - Proper network code and credentials
 * 
 * @param episodeId - The episode ID to sync
 * @param gamConfig - GAM configuration (network code, credentials)
 * @returns Sync result
 */
export async function syncEpisodeToGAM(
  episodeId: number,
  gamConfig: GAMConfig
): Promise<GAMSyncResult> {
  try {
    // Fetch episode
    const episode = await prisma.episode.findUnique({
      where: { id: episodeId },
    });

    if (!episode) {
      throw new Error(`Episode ${episodeId} not found`);
    }

    // Format episode metadata as GAM KVs
    const kvs = formatGAMKVs(episode);

    // TODO: Implement actual GAM API integration
    // This would involve:
    // 1. Authenticating with GAM API using OAuth2
    // 2. Creating or updating custom targeting keys/values
    // 3. Associating KVs with line items or ad units
    // 
    // Example using Google Ads API (similar pattern):
    // const gamClient = new GAMClient({
    //   networkCode: gamConfig.networkCode,
    //   apiKey: gamConfig.apiKey,
    // });
    // 
    // await gamClient.createCustomTargetingKeys(kvs);
    // await gamClient.updateLineItemTargeting(episodeId, kvs);

    // For now, return success with KV count
    // In production, this would actually push to GAM
    console.log(`Would sync ${Object.keys(kvs).length} KVs to GAM for episode ${episodeId}`);

    return {
      success: true,
      episodeId,
      kvCount: Object.keys(kvs).length,
    };
  } catch (error) {
    console.error(`Failed to sync episode ${episodeId} to GAM:`, error);
    return {
      success: false,
      episodeId,
      kvCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Formats GAM KVs for manual copy-paste into GAM UI
 * @param episodeId - The episode ID
 * @returns Formatted string with KVs
 */
export async function formatGAMKVsForManualEntry(
  episodeId: number
): Promise<string> {
  const episode = await prisma.episode.findUnique({
    where: { id: episodeId },
  });

  if (!episode) {
    throw new Error(`Episode ${episodeId} not found`);
  }

  const kvs = formatGAMKVs(episode);
  const lines = Object.entries(kvs).map(([key, value]) => `${key} = ${value}`);
  return lines.join("\n");
}

