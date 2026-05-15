import axios from 'axios';
import https from 'https';
import Parser from 'rss-parser';
import { AggregatedGig } from '@/types/gig';
import { cache } from '@/lib/utils/cache';

// Configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
};

// HTTPS agent with minimal configuration
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  timeout: 15000,
});

// Helper function to get category from source and content
function getCategoryFromSource(source: string, content: string): string {
  const lowerContent = content.toLowerCase();

  // First check source-based mappings
  const sourceMap: Record<string, string> = {
    'WeWorkRemotely Programming': 'Web Dev / Tech',
    'WeWorkRemotely Design': 'Graphic Design',
    'WeWorkRemotely Marketing': 'Marketing',
    'WeWorkRemotely Writing': 'Writing & Publishing',
    'WeWorkRemotely Video': 'Video Editing',
    'WeWorkRemotely Customer Support': 'Beauty & Hair',
    'WeWorkRemotely All': 'Skilled Trades',
  };

  if (sourceMap[source]) {
    return sourceMap[source];
  }

  // Then check content-based categorization
  const categoryKeywords: Record<string, string[]> = {
    'Web Dev / Tech': ['developer', 'programmer', 'software', 'frontend', 'backend', 'fullstack'],
    Marketing: ['marketing', 'social media', 'seo', 'content marketing'],
    'Graphic Design': ['designer', 'graphic', 'ui/ux', 'illustrator'],
    Copywriting: ['copywriter', 'content writer', 'technical writer'],
    'Video Editing': ['video editor', 'motion graphics', 'video production'],
    'Editing/Publishing': ['editor', 'proofreader', 'publisher'],
    Photography: ['photographer', 'photo editor', 'photo retoucher'],
    'Beauty & Hair': ['beauty', 'hair', 'stylist', 'makeup'],
    'Skilled Trades': ['trades', 'craftsman', 'technician'],
    'Writing & Publishing': ['writer', 'author', 'journalist'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerContent.includes(keyword))) {
      return category;
    }
  }

  return 'Other';
}

// Safe RSS fetching with retries and caching
async function safeFetchRSS(url: string, source: string): Promise<AggregatedGig[]> {
  const cacheKey = `rss:${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let retries = 0;
  while (retries < RETRY_CONFIG.maxRetries) {
    try {
      const response = await axios.get(url, {
        httpsAgent,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 10000,
      });

      if (!response.data) {
        throw new Error('Empty response');
      }

      const parser = new Parser();
      const feed = await parser.parseString(response.data);

      if (!feed.items || feed.items.length === 0) {
        throw new Error('No items found in feed');
      }

      const gigs = feed.items.map(item => ({
        id: item.guid || item.link || item.title || Math.random().toString(),
        title: item.title || '',
        description: item.content || item.contentSnippet || item.description || '',
        url: item.link || '',
        source,
        category: getCategoryFromSource(source, item.title || ''),
        postedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      }));

      cache.set(cacheKey, gigs, 15 * 60 * 1000); // Cache for 15 minutes
      return gigs;
    } catch (error) {
      retries++;
      if (retries === RETRY_CONFIG.maxRetries) {
        console.error(`Failed to fetch RSS feed after ${RETRY_CONFIG.maxRetries} retries:`, {
          url,
          source,
          error: error.message,
        });
        return [];
      }
      await new Promise(resolve =>
        setTimeout(resolve, RETRY_CONFIG.initialDelay * Math.pow(2, retries - 1))
      );
    }
  }
  return [];
}

// Updated gig sources using WeWorkRemotely's RSS feeds
export const gigSourceMap: Record<string, Array<() => Promise<AggregatedGig[]>>> = {
  'Web Dev / Tech': [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-programming-jobs.rss',
          'WeWorkRemotely Programming'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely programming jobs:', error);
        return [];
      }
    },
  ],
  Marketing: [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-marketing-jobs.rss',
          'WeWorkRemotely Marketing'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely marketing jobs:', error);
        return [];
      }
    },
  ],
  'Graphic Design': [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-design-jobs.rss',
          'WeWorkRemotely Design'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely design jobs:', error);
        return [];
      }
    },
  ],
  Copywriting: [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-writing-jobs.rss',
          'WeWorkRemotely Writing'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely writing jobs:', error);
        return [];
      }
    },
  ],
  'Video Editing': [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-video-jobs.rss',
          'WeWorkRemotely Video'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely video jobs:', error);
        return [];
      }
    },
  ],
  'Editing/Publishing': [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-writing-jobs.rss',
          'WeWorkRemotely Writing'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely writing jobs:', error);
        return [];
      }
    },
  ],
  Photography: [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-design-jobs.rss',
          'WeWorkRemotely Design'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely design jobs:', error);
        return [];
      }
    },
  ],
  'Beauty & Hair': [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-customer-support-jobs.rss',
          'WeWorkRemotely Customer Support'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely customer support jobs:', error);
        return [];
      }
    },
  ],
  'Skilled Trades': [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-all-remote-jobs.rss',
          'WeWorkRemotely All'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely all jobs:', error);
        return [];
      }
    },
  ],
  'Writing & Publishing': [
    async () => {
      try {
        const feed = await safeFetchRSS(
          'https://weworkremotely.com/categories/remote-writing-jobs.rss',
          'WeWorkRemotely Writing'
        );
        return feed;
      } catch (error) {
        console.error('Error fetching WeWorkRemotely writing jobs:', error);
        return [];
      }
    },
  ],
};
