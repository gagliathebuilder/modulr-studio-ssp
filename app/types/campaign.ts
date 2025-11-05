export interface TargetingFilters {
  iabCategories?: string[];
  sentiment?: string[];
  minBrandSafetyScore?: number;
}

export interface CampaignMatchMetadata {
  episodeId: number;
  matchScore: number;
  cpmUplift: number;
}

