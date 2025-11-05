# Prebid Server Setup & Testing Guide

## Overview

Prebid Server is deployed via Docker and handles programmatic bid requests. The Modulr proxy API (`/api/prebid`) injects contextual metadata into bid requests before forwarding them to Prebid Server.

## Prerequisites

- Docker and Docker Compose installed
- Ports 8000 (Prebid Server) and 2424 (Prebid Cache) available

## Deployment

### Start Prebid Server

```bash
# Start Prebid Server and Prebid Cache
docker-compose up -d prebid-server prebidcache

# Check status
docker-compose ps

# View logs
docker-compose logs -f prebid-server
```

### Verify Health

```bash
# Health check
curl http://localhost:8000/status

# Should return 200 OK
```

## Configuration

### Prebid Server Config

Configuration is in `prebid-server/config.yaml`:
- Adapters: Magnite, PubMatic, OpenX (configured but disabled until credentials added)
- Cache: Points to Prebid Cache container
- GDPR: Enabled with default settings
- Debug logging: Enabled

### Environment Variables

Add adapter credentials to `docker-compose.yml`:
```yaml
environment:
  - MAGNITE_USER_ID=your_magnite_user_id
  - MAGNITE_SECRET_KEY=your_magnite_secret_key
  # ... etc
```

## Testing

### Automated Test Script

Run the test script:
```bash
./test-prebid-server.sh
```

This tests:
1. Prebid Server health endpoint
2. Direct Prebid Server auction endpoint
3. Proxy API with metadata injection
4. Proxy API without episode ID

### Manual Testing

#### 1. Test Prebid Server Directly

```bash
curl -X POST http://localhost:8000/openrtb2/auction \
  -H "Content-Type: application/json" \
  -H "x-openrtb-version: 2.5" \
  -d @test-ortb-request.json
```

#### 2. Test Proxy API with Episode Metadata

```bash
# With episode ID in query param
curl -X POST "http://localhost:3000/api/prebid?episodeId=1" \
  -H "Content-Type: application/json" \
  -H "x-openrtb-version: 2.5" \
  -d @test-ortb-request.json

# Check server logs to verify ext.modulr injection
```

#### 3. Verify Metadata Injection

The proxy API injects Modulr metadata into `ext.modulr`:
```json
{
  "ext": {
    "modulr": {
      "iab_categories": ["IAB1", "IAB2"],
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
  }
}
```

## Troubleshooting

### Prebid Server Won't Start

1. Check Docker logs: `docker-compose logs prebid-server`
2. Verify config file exists: `prebid-server/config.yaml`
3. Check port availability: `lsof -i :8000`

### Proxy API Errors

1. Verify Prebid Server is running: `curl http://localhost:8000/status`
2. Check Next.js app logs for injection errors
3. Verify episode exists in database
4. Check `PREBID_SERVER_URL` environment variable

### No Bids Returned

This is expected if:
- Adapter credentials are not configured
- Test request doesn't match adapter requirements
- Adapters are disabled in config

Focus on verifying metadata injection works, not actual bid responses.

## Integration Notes

- The proxy API is at `/api/prebid`
- Episode ID can be passed via:
  - Query parameter: `?episodeId=123`
  - Request body: `ext.modulr.episodeId`
- Metadata is injected into both request-level and impression-level `ext.modulr`
- Original request is preserved, metadata is merged

## Next Steps

1. Configure adapter credentials for real bid requests
2. Test with actual episode data from database
3. Integrate with GAM yield groups
4. Monitor bid response rates and CPM uplift

