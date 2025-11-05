# Integration Testing Guide

## Overview

This guide covers end-to-end testing procedures for the Modulr platform, including RSS ingestion, metadata enrichment, export validation, and integration testing.

## Test Scripts

### 1. Basic API Tests

**Script:** `test-api.sh`

**Tests:**
- Publisher CRUD operations
- Campaign CRUD operations
- Episode listing
- Campaign-episode matching

**Usage:**
```bash
./test-api.sh
```

### 2. End-to-End Flow Tests

**Script:** `test-e2e-flow.sh`

**Tests:**
- RSS feed ingestion
- Episode enrichment pipeline
- Export format validation
- Ad break manager integration

**Usage:**
```bash
# Use default RSS feed
./test-e2e-flow.sh

# Use custom RSS feed
TEST_RSS_URL="https://example.com/feed.xml" ./test-e2e-flow.sh
```

### 3. Prebid Server Tests

**Script:** `test-prebid-server.sh`

**Tests:**
- Prebid Server health
- Proxy API functionality
- Metadata injection verification

**Usage:**
```bash
./test-prebid-server.sh
```

## Test Data

### Sample RSS Feeds

For testing, use publicly available podcast RSS feeds:

- NPR: `https://feeds.npr.org/510289/podcast.xml`
- BBC: `https://podcasts.files.bbci.co.uk/p02nq0lx.rss`
- Or use your own test feed

### Test Episodes

Create test episodes with:
- Various IAB categories
- Different sentiment scores
- Range of brand safety scores
- Some with ad breaks, some without

## Manual Testing Procedures

### RSS Ingestion Flow

1. **Create Publisher**
   ```bash
   curl -X POST http://localhost:3000/api/publishers \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Publisher", "email": "test@example.com"}'
   ```

2. **Ingest RSS Feed**
   ```bash
   curl -X POST http://localhost:3000/api/ingest/rss \
     -H "Content-Type: application/json" \
     -d '{
       "publisherId": 1,
       "rssUrl": "https://feeds.npr.org/510289/podcast.xml",
       "autoAnalyze": true
     }'
   ```

3. **Verify Episodes Created**
   ```bash
   curl http://localhost:3000/api/episodes?publisherId=1
   ```

### Enrichment Verification

1. **Check Episode Metadata**
   ```bash
   curl http://localhost:3000/api/episodes/1 | jq '.enrichedMetadata'
   ```

2. **Verify Required Fields**
   - `enrichedMetadata` exists
   - `brandSafetyScore` present
   - `sentiment` present
   - `iab_categories` array present

### Export Validation

1. **Test Programmatic Export**
   ```bash
   curl http://localhost:3000/api/episodes/1/export/programmatic | jq '.'
   ```

2. **Test Contextual Export**
   ```bash
   curl http://localhost:3000/api/episodes/1/export/contextual | jq '.'
   ```

3. **Verify Structure**
   - Programmatic: Array/object structure matches Prebid ext format
   - Contextual: Key-value pairs match GAM format
   - Ad breaks included if configured

### Ad Break Manager

1. **Edit Ad Breaks via UI**
   - Navigate to `/library/[episodeId]/edit`
   - Add/modify ad breaks
   - Save changes

2. **Verify via API**
   ```bash
   curl http://localhost:3000/api/episodes/1 | jq '.adBreaks'
   ```

3. **Check Export Inclusion**
   ```bash
   curl http://localhost:3000/api/episodes/1/export/programmatic | jq '.adBreaks'
   ```

## Integration Testing Checklist

### Pre-Deployment

- [ ] All test scripts pass
- [ ] RSS ingestion works with real feeds
- [ ] Enrichment pipeline completes successfully
- [ ] Export formats validated
- [ ] Ad breaks persist and export correctly
- [ ] Campaign matching logic tested

### Prebid Integration

- [ ] Prebid Server starts successfully
- [ ] Health endpoint responds
- [ ] Proxy API forwards requests
- [ ] Metadata injection verified
- [ ] ext.modulr structure correct

### GAM Integration

- [ ] KV format validated
- [ ] Setup instructions page accessible
- [ ] Manual entry format correct
- [ ] (Future) API sync tested

## Troubleshooting

### RSS Ingestion Fails

- Check RSS URL is accessible
- Verify feed format is valid RSS/XML
- Check database connection
- Review ingestion logs

### Enrichment Not Completing

- Verify OpenAI API key configured
- Check API rate limits
- Review enrichment logs
- Verify episode has description/transcript

### Export Format Errors

- Verify episode has enriched metadata
- Check formatter functions
- Review export endpoint logs
- Validate JSON structure

### Ad Breaks Not Persisting

- Check PATCH endpoint logs
- Verify ad break schema validation
- Test via API directly
- Check database constraints

## Continuous Testing

### Automated Tests

Run all tests before deployment:
```bash
./test-api.sh && ./test-e2e-flow.sh && ./test-prebid-server.sh
```

### Pre-Commit Hooks

Consider adding pre-commit hooks to run basic API tests.

### CI/CD Integration

- Run test suite on pull requests
- Validate exports before deployment
- Test Prebid Server connectivity

## Performance Testing

### Load Testing

- Test RSS ingestion with large feeds (100+ episodes)
- Verify enrichment pipeline handles concurrent requests
- Test export endpoints under load

### Monitoring

- Track enrichment completion times
- Monitor API response times
- Watch for database query performance

## Next Steps

1. Set up automated test runs
2. Add integration tests to CI/CD pipeline
3. Create performance benchmarks
4. Document known issues and workarounds

