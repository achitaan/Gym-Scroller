import axios from 'axios';

/**
 * Shorts Curation API
 *
 * Provides curated YouTube Shorts videoIds for the feed.
 * Uses YouTube Data API v3 for discovery (optional) or serves pre-curated lists.
 */

export interface ShortsQueueResponse {
  queue: string[];
}

export class ShortsAPI {
  private apiKey: string | undefined;
  private curatedQueue: string[];

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY; // Server-side only

    // Pre-curated fitness Shorts (replace with real IDs)
    this.curatedQueue = [
      'jfKfPfyJRdk',
      'sDvf4qX3rbs',
      'mCdA4bJAGGk',
      'abc123XYZ',
      'def456UVW',
      'ghi789RST',
    ];
  }

  /**
   * Get a curated queue of Shorts videoIds
   */
  public async getCuratedQueue(limit: number = 10): Promise<ShortsQueueResponse> {
    // Return pre-curated list
    const queue = this.curatedQueue.slice(0, limit);

    return { queue };
  }

  /**
   * Fetch Shorts from YouTube Data API v3 (optional, requires API key)
   *
   * Uses Search: list endpoint with type=video & videoDuration=short
   * Then Videos: list to get details
   *
   * https://developers.google.com/youtube/v3/docs/search/list
   * https://developers.google.com/youtube/v3/docs/videos/list
   */
  public async fetchFromYouTube(query: string = 'strength training', maxResults: number = 10): Promise<ShortsQueueResponse> {
    if (!this.apiKey) {
      console.warn('[ShortsAPI] YouTube API key not configured, returning curated queue');
      return this.getCuratedQueue(maxResults);
    }

    try {
      // Step 1: Search for Shorts
      const searchUrl = 'https://www.googleapis.com/youtube/v3/search';
      const searchParams = {
        part: 'id',
        type: 'video',
        videoDuration: 'short', // Filter for Shorts (< 60s)
        q: query,
        maxResults,
        key: this.apiKey,
      };

      const searchResponse = await axios.get(searchUrl, { params: searchParams });
      const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId);

      if (videoIds.length === 0) {
        console.warn('[ShortsAPI] No videos found, returning curated queue');
        return this.getCuratedQueue(maxResults);
      }

      // Step 2: Get video details (optional, to verify they're embeddable)
      const videosUrl = 'https://www.googleapis.com/youtube/v3/videos';
      const videosParams = {
        part: 'status,contentDetails',
        id: videoIds.join(','),
        key: this.apiKey,
      };

      const videosResponse = await axios.get(videosUrl, { params: videosParams });

      // Filter for embeddable videos
      const embeddableIds = videosResponse.data.items
        .filter((video: any) => video.status.embeddable)
        .map((video: any) => video.id);

      console.log(`[ShortsAPI] Fetched ${embeddableIds.length} embeddable Shorts from YouTube`);

      return { queue: embeddableIds };

    } catch (error) {
      console.error('[ShortsAPI] Error fetching from YouTube:', error);
      // Fallback to curated queue
      return this.getCuratedQueue(maxResults);
    }
  }

  /**
   * Add a videoId to the curated queue (for custom curation)
   */
  public addToCuratedQueue(videoId: string) {
    if (!this.curatedQueue.includes(videoId)) {
      this.curatedQueue.push(videoId);
    }
  }

  /**
   * Remove a videoId from the curated queue
   */
  public removeFromCuratedQueue(videoId: string) {
    this.curatedQueue = this.curatedQueue.filter(id => id !== videoId);
  }

  /**
   * Get curated queue size
   */
  public getCuratedQueueSize(): number {
    return this.curatedQueue.length;
  }
}
