# GAM Integration Setup Guide

## Overview

This guide covers integrating Modulr contextual metadata with Google Ad Manager (GAM). The GAM setup page (`/gam-setup`) provides instructions for manual configuration.

> **Note:** This is an advanced/internal configuration page. Publishers should use the simplified "Enable Ads" workflow in the main UI.

## Current Status

The GAM integration currently supports:
- ✅ Metadata formatting as GAM key-values
- ✅ Manual copy-paste setup instructions
- ⏳ Programmatic API sync (future enhancement)

## Manual Setup Process

### Step 1: Create Custom Targeting Keys

1. Log in to Google Ad Manager
2. Navigate to **Admin → Targeting → Custom targeting**
3. Click **"New custom targeting key"**
4. Create the following keys:

| Key Name | Type | Description |
|----------|------|-------------|
| `modulr_iab_cat` | Predefined | IAB Content Categories (comma-separated) |
| `modulr_sentiment` | Predefined | Content sentiment (positive/neutral/negative) |
| `modulr_brand_safety` | Free-form | Brand safety score (0-10) |
| `modulr_segments` | Predefined | Contextual audience segments |
| `modulr_topics` | Free-form | Topic keywords (comma-separated) |
| `modulr_entities` | Free-form | Named entities (comma-separated) |
| `ad_0_start`, `ad_1_start`, etc. | Free-form | Ad break start times (seconds) |
| `ad_0_maxdur`, `ad_1_maxdur`, etc. | Free-form | Ad break max durations (seconds) |

### Step 2: Export Episode Metadata

1. Navigate to episode in Library
2. Click **"Contextual"** export button
3. Copy the exported JSON

### Step 3: Create Targeting Values

For predefined keys (like `modulr_sentiment`), create values:
- `positive`
- `neutral`
- `negative`

For predefined segments, create values based on your contextual segments.

### Step 4: Apply to Line Items

1. Create or edit a line item
2. Add custom targeting
3. Select Modulr keys and values
4. Save line item

## Key-Value Format

Example exported KVs:
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

## Using the Setup Page

1. Navigate to `/gam-setup`
2. Enter episode ID
3. Click **"Preview KVs"**
4. Copy formatted key-values
5. Use in GAM UI as needed

## Future: Programmatic Sync

Planned enhancements:
- OAuth2 authentication with GAM API
- Automatic KV creation/updates
- Line item targeting automation
- Real-time sync on episode updates

## Troubleshooting

### KVs Not Appearing in GAM

- Verify key names match exactly (case-sensitive)
- Check key types match (predefined vs free-form)
- Ensure values exist for predefined keys

### Ad Break Keys Missing

- Verify episode has ad breaks configured
- Check ad break format in database
- Export again after updating ad breaks

### Value Length Limits

GAM has a 500-character limit for KV values. Long topics/entities are automatically truncated.

## Best Practices

1. **Predefined Keys**: Use for values you'll reuse (sentiment, segments)
2. **Free-form Keys**: Use for variable content (topics, entities)
3. **Value Creation**: Create common values before bulk imports
4. **Testing**: Test targeting with a small line item first

## Related Documentation

- [Prebid Setup Guide](./prebid-setup.md)
- [Integration Testing Guide](./integration-testing.md)
- [Marketplace Simulation](./marketplace-simulation.md)

