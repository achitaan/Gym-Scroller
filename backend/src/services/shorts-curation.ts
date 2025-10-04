/**
 * Shorts Curation Service
 * Manages YouTube Shorts video queue using YouTube Data API v3
 */
export class ShortsCurationService {
  private apiKey: string;
  private cache: string[] = [];
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  // Curated search terms for fitness content
  private readonly FITNESS_SEEDS = [
    'gym workout',
    'strength training',
    'powerlifting',
    'bodybuilding',
    'fitness motivation',
    'gym tips',
    'exercise form',
    'workout shorts',
    'gym shorts',
    'lifting technique',
  ];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get a curated queue of Shorts video IDs
   * Uses caching to respect API quotas
   */
  public async getCuratedQueue(count: number = 10): Promise<string[]> {
    // Check cache
    if (this.cache.length >= count && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cache.slice(0, count);
    }

    // Fetch new shorts
    try {
      const shorts = await this.fetchShortsFromAPI(count * 2); // Fetch extra for filtering
      this.cache = shorts;
      this.cacheTimestamp = Date.now();
      return shorts.slice(0, count);
    } catch (error) {
      console.error('Failed to fetch shorts from API:', error);
      // Return cached results if available
      if (this.cache.length > 0) {
        return this.cache.slice(0, count);
      }
      throw error;
    }
  }

  /**
   * Fetch shorts from YouTube Data API v3
   */
  private async fetchShortsFromAPI(count: number): Promise<string[]> {
    if (!this.apiKey) {
      console.warn('YouTube API key not configured, using mock data');
      return this.getMockShorts(count);
    }

    const videoIds: string[] = [];
    const maxResults = Math.min(50, count);

    // Random seed for variety
    const seed = this.FITNESS_SEEDS[Math.floor(Math.random() * this.FITNESS_SEEDS.length)];

    // Random time window (last 6 months)
    const publishedAfter = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Search for short videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      new URLSearchParams({
        key: this.apiKey,
        part: 'snippet',
        type: 'video',
        q: seed,
        videoDuration: 'short', // <4 min (we'll filter to ≤60s)
        maxResults: String(maxResults),
        order: 'relevance',
        safeSearch: 'moderate',
        publishedAfter,
      });

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.error) {
      throw new Error(`YouTube API error: ${searchData.error.message}`);
    }

    const candidateIds = (searchData.items || [])
      .map((item: any) => item.id?.videoId)
      .filter(Boolean);

    if (candidateIds.length === 0) {
      return this.getMockShorts(count);
    }

    // 2. Get video details to filter true Shorts (≤60s)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      new URLSearchParams({
        key: this.apiKey,
        part: 'contentDetails,snippet',
        id: candidateIds.join(','),
      });

    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    if (videosData.error) {
      throw new Error(`YouTube API error: ${videosData.error.message}`);
    }

    // Filter to ≤60 seconds
    const shorts = (videosData.items || [])
      .filter((video: any) => {
        const duration = video.contentDetails?.duration || '';
        const seconds = this.parseDuration(duration);
        return seconds > 0 && seconds <= 60;
      })
      .map((video: any) => video.id);

    return shorts.length > 0 ? shorts : this.getMockShorts(count);
  }

  /**
   * Parse ISO 8601 duration to seconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * Fallback mock shorts for development
   */
  private getMockShorts(count: number): string[] {
    // Some real fitness shorts video IDs for testing
    const mockIds = [
      'dQw4w9WgXcQ', // Example video
      'jNQXAC9IVRw', // Another example
      'yPYZpwSpKmA', // Fitness short
      // Add more real Shorts IDs here for testing
    ];

    // Generate random mock IDs if we need more
    while (mockIds.length < count) {
      mockIds.push(this.generateMockId());
    }

    return mockIds.slice(0, count);
  }

  /**
   * Generate a random mock video ID
   */
  private generateMockId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let id = '';
    for (let i = 0; i < 11; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /**
   * Clear cache (useful for testing)
   */
  public clearCache(): void {
    this.cache = [];
    this.cacheTimestamp = 0;
  }
}
