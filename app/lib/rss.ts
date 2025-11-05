import Parser from "rss-parser";

const parser = new Parser();

export interface RSSEpisode {
  title: string;
  description?: string;
  audioUrl?: string;
  publishDate?: Date;
  guid?: string;
  link?: string;
  duration?: number;
}

export interface RSSFeed {
  title: string;
  description?: string;
  link?: string;
  episodes: RSSEpisode[];
}

/**
 * Fetches and parses an RSS feed
 * @param rssUrl - The URL of the RSS feed
 * @returns Parsed RSS feed with episodes
 */
export async function parseRSSFeed(rssUrl: string): Promise<RSSFeed> {
  try {
    const feed = await parser.parseURL(rssUrl);

    const episodes: RSSEpisode[] = (feed.items || []).map((item) => {
      // Extract audio URL from enclosure or media:content
      let audioUrl: string | undefined;
      if (item.enclosure?.url && item.enclosure.type?.startsWith("audio/")) {
        audioUrl = item.enclosure.url;
      } else if (item["media:content"] && typeof item["media:content"] === "object") {
        const mediaContent = item["media:content"] as any;
        if (mediaContent["$"]?.url) {
          audioUrl = mediaContent["$"].url;
        }
      } else if (item["itunes:enclosure"]) {
        const itunesEnclosure = item["itunes:enclosure"] as any;
        if (itunesEnclosure["$"]?.url) {
          audioUrl = itunesEnclosure["$"].url;
        }
      }

      // Extract duration (in seconds) if available
      let duration: number | undefined;
      if (item["itunes:duration"]) {
        const durStr = String(item["itunes:duration"]);
        const parts = durStr.split(":").map(Number);
        if (parts.length === 3) {
          // HH:MM:SS
          duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          // MM:SS
          duration = parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
          // SS
          duration = parts[0];
        }
      }

      return {
        title: item.title || "Untitled Episode",
        description: item.contentSnippet || item.content || item.summary,
        audioUrl,
        publishDate: item.pubDate ? new Date(item.pubDate) : undefined,
        guid: item.guid || item.id || item.link,
        link: item.link,
        duration,
      };
    });

    return {
      title: feed.title || "Untitled Feed",
      description: feed.description,
      link: feed.link,
      episodes,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse RSS feed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Validates an RSS URL format
 * @param url - The URL to validate
 * @returns true if URL appears valid
 */
export function validateRSSUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

