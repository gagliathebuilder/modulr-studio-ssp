# Prebid Server Dockerfile
# Based on official Prebid Server image
FROM prebid/prebid-server:latest

# Copy custom configuration
COPY config.yaml /config/config.yaml

# Expose Prebid Server port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/status || exit 1

