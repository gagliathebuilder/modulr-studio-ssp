# Marketplace Simulation Guide

## Overview

This guide documents how to generate and validate sample outputs for partner demonstrations. Sample outputs showcase the metadata enrichment and export capabilities of the Modulr platform.

## Sample Output Formats

### 1. Enriched JSON (Full Metadata)

**Endpoint:** `GET /api/episodes/[id]`

**Example:**
```json
{
  "id": 1,
  "title": "Episode Title",
  "enrichedMetadata": {
    "summary": "Episode summary...",
    "topics": ["AI", "Machine Learning"],
    "entities": ["OpenAI", "GPT"],
    "tone": "informative",
    "sentiment": "positive",
    "brand_safety_score": 8.5,
    "iab_categories": ["IAB1", "IAB19"],
    "contextual_segments": ["tech", "business"]
  },
  "brandSafetyScore": 8.5,
  "sentiment": "positive",
  "adBreaks": [
    {
      "id": "break-1",
      "startTime": 120,
      "maxDuration": 30
    }
  ]
}
```

### 2. Programmatic Data Block (Prebid Format)

**Endpoint:** `GET /api/episodes/[id]/export/programmatic`

**Example:**
```json
{
  "iab_categories": ["IAB1", "IAB19"],
  "sentiment": "positive",
  "brand_safety_score": 8.5,
  "contextual_segments": ["tech", "business"],
  "topics": ["AI", "Machine Learning"],
  "entities": ["OpenAI", "GPT"],
  "adBreaks": [
    {
      "id": "break-1",
      "startTime": 120,
      "maxDuration": 30
    }
  ]
}
```

**Use Case:** Injected into ORTB bid requests via `ext.modulr` for programmatic auctions.

### 3. Contextual Signals (GAM Format)

**Endpoint:** `GET /api/episodes/[id]/export/contextual`

**Example:**
```json
{
  "modulr_iab_cat": "IAB1,IAB19",
  "modulr_sentiment": "positive",
  "modulr_brand_safety": "8.5",
  "modulr_segments": "tech,business",
  "modulr_topics": "AI,Machine Learning",
  "modulr_entities": "OpenAI,GPT",
  "ad_0_start": "120",
  "ad_0_maxdur": "30",
  "ad_0_id": "break-1"
}
```

**Use Case:** Custom targeting key-values for Google Ad Manager line items.

## Validation Checklist

### IAB Standards Compliance

- [ ] IAB categories follow IAB Content Taxonomy 3.0
- [ ] Categories are properly formatted (e.g., "IAB1", not "iab1")
- [ ] Brand safety scores are 0-10 scale
- [ ] Sentiment values are: "positive", "neutral", "negative"

### Data Completeness

- [ ] All episodes have enriched metadata
- [ ] Brand safety scores present for all episodes
- [ ] Sentiment classification present
- [ ] IAB categories assigned
- [ ] Ad breaks included (if configured)

### Export Format Validation

- [ ] Programmatic format matches Prebid ext.modulr structure
- [ ] Contextual format matches GAM KV naming conventions
- [ ] Ad breaks correctly formatted in both exports
- [ ] No null/undefined values in exports
- [ ] String lengths within GAM limits (500 chars)

## Generating Sample Outputs

### Step 1: Select Test Episodes

Choose 3-5 episodes with diverse metadata:
- Different IAB categories
- Varied sentiment scores
- Different brand safety scores
- Episodes with and without ad breaks

### Step 2: Generate Exports

```bash
# Get episode IDs
curl http://localhost:3000/api/episodes | jq '.episodes[].id'

# Export programmatic data
curl http://localhost:3000/api/episodes/1/export/programmatic > episode-1-programmatic.json

# Export contextual signals
curl http://localhost:3000/api/episodes/1/export/contextual > episode-1-contextual.json

# Get full enriched JSON
curl http://localhost:3000/api/episodes/1 > episode-1-enriched.json
```

### Step 3: Validate Against Standards

- Check IAB category format
- Verify brand safety score range
- Confirm sentiment values
- Validate ad break structure

## Campaign Matching Validation

Test campaign matching logic:

```bash
# Create test campaign
curl -X POST http://localhost:3000/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Campaign",
    "budget": 10000,
    "publisherId": 1,
    "status": "active",
    "targetingFilters": {
      "iabCategories": ["IAB1", "IAB19"],
      "sentiment": ["positive"],
      "minBrandSafetyScore": 7
    }
  }'

# Get matching episodes
curl http://localhost:3000/api/campaigns/1 | jq '.matchingEpisodes'
```

## Partner Demo Checklist

Before presenting to partners:

- [ ] Sample outputs generated for 3-5 episodes
- [ ] All formats validated
- [ ] Campaign matching tested
- [ ] Ad break exports verified
- [ ] Documentation prepared
- [ ] Sample outputs saved in `docs/samples/`

## Sample Output Storage

Store validated sample outputs in:
```
docs/samples/
  ├── episode-1-enriched.json
  ├── episode-1-programmatic.json
  ├── episode-1-contextual.json
  ├── campaign-matching-example.json
  └── README.md
```

## Notes for Partners

### For SSPs/DSPs

- Programmatic data block is injected into ORTB requests
- Compatible with Prebid Server and header bidding
- Metadata available at request-time for bid decisions

### For Publishers

- Contextual signals sync to GAM automatically
- No manual configuration required
- Ad breaks mapped to placement opportunities

### For Advertisers

- IAB-standard categorization
- Brand safety scoring (0-10)
- Sentiment analysis for brand fit
- Contextual segments for targeting

