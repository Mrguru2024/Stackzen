// --- API KEY ENV TEMPLATE ---
// Add these to your .env.local:
// ADZUNA_APP_ID=your-adzuna-app-id
// ADZUNA_APP_KEY=your-adzuna-app-key
// (Add more as needed for other sources)

import axios from 'axios';
import Parser from 'rss-parser';
// import https from 'https';
// import { cache } from '../utils/cache';
import { normalizeCountryName } from '@/lib/utils/format';
import { fetchMonsterGigs } from './fetchers/monster';
import { fetchCareerjetJobs } from './fetchers/careerjet';
import { fetchJobicyJobs } from './fetchers/jobicy';
import { mapCategory } from './category-mapping';
import { addDays } from 'date-fns';

// 1. Fix type import or define locally if missing
export type AggregatedGig = {
  id: string;
  title: string;
  description: string;
  url: string;
  budget?: {
    amount?: number;
    currency?: string;
    type?: string;
  } | null;
  skills?: string[];
  postedAt?: string;
  location?: string;
  company?: {
    name?: string;
    logo?: string;
    website?: string;
  };
  jobType?: string;
  experience?: string;
  [key: string]: any;
};

// Configuration
// const _RETRY_CONFIG = {
//   maxRetries: 3,
//   initialDelay: 1000,
// };

// Rate limiting configuration
// const RATE_LIMIT = {
//   windowMs: 60 * 1000, // 1 minute
//   maxRequests: 30, // max requests per window
//   currentRequests: 0,
//   windowStart: Date.now(),
// };

// API key rotation configuration
const _API_KEYS = {
  dribbble: process.env.DRIBBBLE_API_KEY ? [process.env.DRIBBBLE_API_KEY] : [],
  currentIndex: {
    dribbble: 0,
  },
};

// HTTPS agent with minimal configuration
// const _httpsAgent = new https.Agent({
//   rejectUnauthorized: false,
//   timeout: 15000,
// });

// Rate limit check and update
// function checkRateLimit(): boolean {
//   const now = Date.now();
//   if (now - RATE_LIMIT.windowStart >= RATE_LIMIT.windowMs) {
//     RATE_LIMIT.currentRequests = 0;
//     RATE_LIMIT.windowStart = now;
//   }
//
//   if (RATE_LIMIT.currentRequests >= RATE_LIMIT.maxRequests) {
//     return false;
//   }
//
//   RATE_LIMIT.currentRequests++;
//   return true;
// }

// Get next API key with rotation
function getNextApiKey(service: 'dribbble'): string | null {
  const keys = _API_KEYS[service];
  if (!keys.length) return null;

  const currentIndex = _API_KEYS.currentIndex[service];
  _API_KEYS.currentIndex[service] = (currentIndex + 1) % keys.length;
  return keys[currentIndex];
}

// Helper function to get category from source and content
// function getCategoryFromSource(source: string, content: string): string {
//   const lowerContent = content.toLowerCase();
//
//   // First check source-based mappings
//   const sourceMap: Record<string, string> = {
//     'GitHub Jobs': 'Web Dev / Tech',
//     'Stack Overflow': 'Web Dev / Tech',
//     Behance: 'Graphic Design',
//     Dribbble: 'Graphic Design',
//     ProBlogger: 'Writing & Publishing',
//     Upwork: 'Skilled Trades',
//     RemoteOK: 'Web Dev / Tech',
//     WeWorkRemotely: 'Web Dev / Tech',
//     Remotive: 'Web Dev / Tech',
//     'Working Nomads': 'Web Dev / Tech',
//   };
//
//   if (sourceMap[source]) {
//     return sourceMap[source];
//   }
//
//   // Then check content-based categorization
//   const categoryKeywords: Record<string, string[]> = {
//     'Web Dev / Tech': ['developer', 'programmer', 'software', 'frontend', 'backend', 'fullstack'],
//     Marketing: ['marketing', 'social media', 'seo', 'content marketing'],
//     'Graphic Design': ['designer', 'graphic', 'ui/ux', 'illustrator'],
//     Copywriting: ['copywriter', 'content writer', 'technical writer'],
//     'Video Editing': ['video editor', 'motion graphics', 'video production'],
//     'Editing/Publishing': ['editor', 'proofreader', 'publisher'],
//     Photography: ['photographer', 'photo editor', 'photo retoucher'],
//     'Beauty & Hair': ['beauty', 'hair', 'stylist', 'makeup'],
//     'Skilled Trades': ['trades', 'craftsman', 'technician'],
//     'Writing & Publishing': ['writer', 'author', 'journalist'],
//   };
//
//   for (const [category, keywords] of Object.entries(categoryKeywords)) {
//     if (keywords.some(keyword => lowerContent.includes(keyword))) {
//       return category;
//     }
//   }
//
//   return 'Other';
// }

// Enhanced error types
interface APIError extends Error {
  statusCode?: number;
  response?: {
    status: number;
    data?: any;
    headers?: Record<string, string>;
  };
  code?: string;
  isAxiosError?: boolean;
  config?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
}

// Add caching configuration
const _CACHE_CONFIG = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 1000, // Maximum number of cached items
};

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();

const _getCachedData = (key: string) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < _CACHE_CONFIG.ttl) {
    return cached.data;
  }
  return null;
};

const _setCachedData = (key: string, data: any) => {
  if (cache.size >= _CACHE_CONFIG.maxSize) {
    // Remove oldest entries if cache is full
    const _oldestKey = Array.from(cache.keys())[0];
    cache.delete(_oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
};

// Enhanced data normalizers
const _dataNormalizers = {
  dribbble: (item: any) => ({
    id: item.id?.toString() || Math.random().toString(),
    title: item.title || 'Untitled Design',
    description: item.description || '',
    url: item.html_url || item.url || '',
    budget: null,
    skills: item.tags || [],
    postedAt: item.created_at || new Date().toISOString(),
    images: item.images
      ? {
          normal: item.images.normal,
          teaser: item.images.teaser,
          hidpi: item.images.hidpi,
        }
      : null,
  }),
  upwork: (item: any) => ({
    id: item.guid || Math.random().toString(),
    title: item.title || 'Untitled Job',
    description: item.description || '',
    url: item.link || '',
    budget: item.budget || null,
    skills: item.categories || [],
    postedAt: item.pubDate || new Date().toISOString(),
    client: {
      country: item.client?.country,
      feedback: item.client?.feedback,
    },
  }),
  freelancer: (item: any) => ({
    id: item.id?.toString() || Math.random().toString(),
    title: item.title || 'Untitled Project',
    description: item.description || '',
    url: item.url || '',
    budget: {
      amount: item.budget?.amount,
      currency: item.budget?.currency,
      type: item.budget?.type,
    },
    skills: item.skills || [],
    postedAt: item.submitdate || new Date().toISOString(),
    proposals: item.proposals || 0,
  }),
  indeed: (item: any) => ({
    id: item.guid || Math.random().toString(),
    title: item.title || 'Untitled Job',
    description: item.description || '',
    url: item.link || '',
    budget: {
      amount: item.salary?.amount,
      currency: item.salary?.currency || 'USD',
      type: item.salary?.type || 'hourly',
    },
    skills: item.categories || [],
    postedAt: item.pubDate || new Date().toISOString(),
    location: item.location || 'Remote',
    company: {
      name: item.company?.name,
      logo: item.company?.logo,
      website: item.company?.website,
    },
    jobType: item.jobType || 'Full-time',
    experience: item.experience || 'Not specified',
  }),
  linkedin: (item: any) => ({
    id: item.guid || Math.random().toString(),
    title: item.title || 'Untitled Position',
    description: item.description || '',
    url: item.link || '',
    budget: {
      amount: item.salary?.amount,
      currency: item.salary?.currency || 'USD',
      type: item.salary?.type || 'annual',
    },
    skills: item.skills || [],
    postedAt: item.pubDate || new Date().toISOString(),
    location: item.location || 'Remote',
    company: {
      name: item.company?.name,
      logo: item.company?.logo,
      website: item.company?.website,
    },
    jobType: item.jobType || 'Full-time',
    experience: item.experience || 'Not specified',
    industry: item.industry || 'Not specified',
  }),
  taskrabbit: (item: any) => ({
    id: item.guid || Math.random().toString(),
    title: item.title || 'Untitled Task',
    description: item.description || '',
    url: item.link || '',
    budget: {
      amount: item.budget?.amount,
      currency: item.budget?.currency || 'USD',
    },
    skills: item.categories || [],
    postedAt: item.pubDate || new Date().toISOString(),
    location: item.location || 'Remote',
    taskType: item.taskType || 'General',
  }),
  remotive: (item: any) => ({
    id: item.guid || Math.random().toString(),
    title: item.title || 'Untitled Job',
    description: item.description || '',
    url: item.link || '',
    budget: null,
    skills: item.categories || [],
    postedAt: item.pubDate || new Date().toISOString(),
    company: {
      name: item.company?.name,
      logo: item.company?.logo,
      website: item.company?.website,
    },
    location: item.location || 'Remote',
    tags: item.tags || [],
  }),
  angi: (item: any) => ({
    id: item.guid || Math.random().toString(),
    title: item.title || 'Untitled Service',
    description: item.description || '',
    url: item.link || '',
    budget: {
      amount: item.price?.amount,
      currency: item.price?.currency || 'USD',
      type: item.price?.type || 'hourly',
    },
    skills: item.categories || [],
    postedAt: item.pubDate || new Date().toISOString(),
    location: item.location || 'Remote',
    serviceType: item.serviceType || 'General',
    client: {
      rating: item.client?.rating,
      reviews: item.client?.reviews,
    },
  }),
  reedsy: (item: any) => ({
    id: item.guid || Math.random().toString(),
    title: item.title || 'Untitled Project',
    description: item.description || '',
    url: item.link || '',
    budget: {
      amount: item.budget?.amount,
      currency: item.budget?.currency || 'USD',
      type: item.budget?.type || 'fixed',
    },
    skills: item.categories || [],
    postedAt: item.pubDate || new Date().toISOString(),
    location: item.location || 'Remote',
    projectType: item.projectType || 'General',
    deadline: item.deadline,
    wordCount: item.wordCount,
  }),
  // Common field normalizers
  normalizeSkills: (skills: string[] | string | undefined): string[] => {
    if (!skills) return [];
    if (typeof skills === 'string') {
      return skills.split(',').map(s => s.trim().toLowerCase());
    }
    return skills.map(s => s.toLowerCase());
  },
  normalizeBudget: (
    amount: number | string | undefined,
    currency: string = 'USD',
    type: string = 'hourly'
  ): { amount: number; currency: string; type: string } => {
    if (!amount) return { amount: 0, currency, type };
    const _numAmount =
      typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
    return {
      amount: isNaN(_numAmount) ? 0 : _numAmount,
      currency: currency.toUpperCase(),
      type: ['hourly', 'fixed', 'annual', 'monthly'].includes(type.toLowerCase())
        ? type.toLowerCase()
        : 'hourly',
    };
  },
  normalizeLocation: (location: string | undefined): string => {
    if (!location) return 'Remote';
    const _remoteKeywords = ['remote', 'anywhere', 'worldwide', 'global'];
    return _remoteKeywords.some(keyword => location.toLowerCase().includes(keyword))
      ? 'Remote'
      : location;
  },
  normalizeExperience: (exp: string | number | undefined): string => {
    if (!exp) return 'Not specified';
    if (typeof exp === 'number') {
      return `${exp} years`;
    }
    const _expLevels = ['entry', 'junior', 'mid', 'senior', 'lead', 'expert'];
    const _level = _expLevels.find(l => exp.toLowerCase().includes(l));
    return _level ? _level.charAt(0).toUpperCase() + _level.slice(1) : exp;
  },
};

// Enhanced error handlers
const _errorHandlers = {
  dribbble: (error: APIError) => {
    if (error.message?.includes('TLS protocol version')) {
      console.error('Dribbble TLS protocol conflict, skipping retry');
      return true;
    }
    if (error.response?.status === 429) {
      console.warn('Dribbble rate limit exceeded, waiting before retry');
      return false;
    }
    return false;
  },

  github: (error: APIError) => {
    if (error.code === 'ECONNREFUSED') {
      console.error('GitHub Jobs API is not available');
      return true;
    }
    return false;
  },

  stackoverflow: (error: APIError) => {
    if (error.response?.status === 400) {
      console.error('Stack Overflow API method not found');
      return true;
    }
    if (error.response?.status === 429) {
      console.warn('Stack Overflow rate limit exceeded, waiting before retry');
      return false;
    }
    return false;
  },

  upwork: (error: APIError) => {
    if (error.response?.status === 410) {
      console.error('Upwork RSS feed is no longer available');
      return true;
    }
    return false;
  },

  freelancer: (error: APIError) => {
    if (error.response?.status === 401) {
      console.error('Freelancer API authentication failed');
      return true;
    }
    if (error.response?.status === 429) {
      console.warn('Freelancer rate limit exceeded, waiting before retry');
      return false;
    }
    return false;
  },

  // Common error patterns
  handleRateLimit: (error: APIError, source: string) => {
    if (error.response?.status === 429) {
      const _retryAfter = error.response.headers?.['retry-after'];
      console.warn(`${source} rate limit exceeded, retry after ${_retryAfter || 'default delay'}`);
      return false; // Retry after delay
    }
    return false;
  },

  handleAuthError: (error: APIError, source: string) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error(`${source} authentication failed`);
      return true; // Skip retry
    }
    return false;
  },

  handleTLS: (error: APIError, source: string) => {
    if (error.message?.includes('TLS protocol version')) {
      console.error(`${source} TLS protocol conflict, skipping retry`);
      return true;
    }
    return false;
  },

  handleTimeout: (error: APIError, source: string) => {
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.warn(`${source} request timed out, retrying...`);
      return false;
    }
    return false;
  },

  handleConnection: (error: APIError, source: string) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
      console.warn(`${source} connection issue, retrying...`);
      return false;
    }
    return false;
  },
};

// Enhanced safeFetchAPI with caching and better error handling
const safeFetchAPI = async (
  url: string,
  source: string,
  options: {
    requiresApiKey?: boolean;
    apiKeyService?: string;
    errorHandler?: (error: APIError) => boolean;
    normalizer?: (data: any) => AggregatedGig[];
  } = {}
): Promise<AggregatedGig[]> => {
  const _cacheKey = `${source}-${url}`;
  const _cachedData = _getCachedData(_cacheKey);
  if (_cachedData) {
    console.log(`Using cached data for ${source}`);
    return _cachedData;
  }

  try {
    const _apiKey = options.requiresApiKey
      ? getNextApiKey(options.apiKeyService! as 'dribbble')
      : null;
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      ...(_apiKey && { Authorization: `Bearer ${_apiKey}` }),
    };

    const _response = await axios.get(url, { headers: headers, timeout: 10000 });

    if (!_response.data) {
      throw new Error(`Empty response from ${source}`);
    }

    let normalizedData: AggregatedGig[] = [];
    if (options.normalizer) {
      normalizedData = options.normalizer(_response.data);
    } else {
      // Default normalization
      normalizedData = Array.isArray(_response.data) ? _response.data : [_response.data];
    }

    // Apply common normalizers
    normalizedData = normalizedData.map(gig => ({
      ...gig,
      skills: _dataNormalizers.normalizeSkills(gig.skills),
      budget: _dataNormalizers.normalizeBudget(
        gig.budget?.amount,
        gig.budget?.currency,
        gig.budget?.type
      ),
      location: _dataNormalizers.normalizeLocation(gig.location),
      experience: _dataNormalizers.normalizeExperience(gig.experience),
    }));

    _setCachedData(_cacheKey, normalizedData);
    return normalizedData;
  } catch (error: any) {
    const apiError: APIError = {
      name: 'APIError',
      message: error.message,
      code: error.code,
      // Remove status and headers as they are not part of APIError
    };

    // Apply common error handlers
    if (_errorHandlers.handleRateLimit(apiError, source)) return [];
    if (_errorHandlers.handleAuthError(apiError, source)) return [];
    if (_errorHandlers.handleTLS(apiError, source)) return [];
    if (_errorHandlers.handleTimeout(apiError, source)) return [];
    if (_errorHandlers.handleConnection(apiError, source)) return [];

    // Apply source-specific error handler
    if (options.errorHandler && options.errorHandler(apiError)) {
      return [];
    }

    console.error(`Failed to fetch ${source}:`, {
      url,
      error: apiError.message,
      code: apiError.code,
      // Remove status and headers as they are not part of APIError
    });

    return [];
  }
};

// Add Indeed as a reliable source
const _fetchIndeedJobs = async (): Promise<AggregatedGig[]> => {
  try {
    const feed = await safeFetchAPI('https://api.indeed.com/v2/jobs/search', 'Indeed', {
      errorHandler: (error: APIError) => {
        if (error.response?.status === 429) {
          console.warn('Indeed rate limit exceeded, waiting before retry');
          return false;
        }
        return false;
      },
      normalizer: (data: any) => {
        if (!data?.results) return [];
        return data.results.map((job: any) => ({
          id: `indeed-${job.jobkey}`,
          title: job.jobtitle,
          description: job.snippet,
          url: job.url,
          budget: {
            amount: job.salary || 0,
            currency: 'USD',
            type: job.salary_type || 'hourly',
          },
          skills: job.skills || [],
          postedAt: new Date(job.date).toISOString(),
          location: job.formattedLocation || 'Remote',
          company: {
            name: job.company,
            logo: job.company_logo,
          },
          source: 'Indeed',
          category: mapCategory('Indeed', job.category || job.jobtitle),
          tradeType: 'Job',
        }));
      },
    });
    return feed;
  } catch (_error: any) {
    console.error('Error fetching Indeed jobs:', _error);
    return [];
  }
};

// Add ZipRecruiter as a reliable source
const _fetchZipRecruiterJobs = async (): Promise<AggregatedGig[]> => {
  try {
    const feed = await safeFetchAPI('https://api.ziprecruiter.com/jobs/v1', 'ZipRecruiter', {
      errorHandler: (error: APIError) => {
        if (error.response?.status === 429) {
          console.warn('ZipRecruiter rate limit exceeded, waiting before retry');
          return false;
        }
        return false;
      },
      normalizer: (data: any) => {
        if (!data?.jobs) return [];
        return data.jobs.map((job: any) => ({
          id: `ziprecruiter-${job.id}`,
          title: job.name,
          description: job.description,
          url: job.url,
          budget: {
            amount: job.salary_min || 0,
            currency: 'USD',
            type: job.salary_type || 'hourly',
          },
          skills: job.skills || [],
          postedAt: new Date(job.posted_time).toISOString(),
          location: job.location || 'Remote',
          company: {
            name: job.hiring_company?.name,
            logo: job.hiring_company?.logo_url,
          },
          source: 'ZipRecruiter',
          category: mapCategory('ZipRecruiter', job.category || job.name),
          tradeType: 'Job',
        }));
      },
    });
    return feed;
  } catch (error) {
    console.error('Error fetching ZipRecruiter jobs:', error);
    return [];
  }
};

// --- Adzuna Fetcher (API Key Required) ---
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;
const _fetchAdzunaJobs = async (): Promise<AggregatedGig[]> => {
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    console.warn('Adzuna API keys missing. Skipping Adzuna jobs.');
    return [];
  }
  try {
    const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}`;
    const response = await axios.get(url);
    const data = response.data;
    if (!data?.results) return [];
    return data.results.map((job: any) => ({
      id: `adzuna-${job.id}`,
      title: job.title,
      description: job.description,
      url: job.redirect_url,
      budget: {
        amount: job.salary_min || 0,
        currency: job.salary_currency || 'USD',
        type: job.contract_type || 'hourly',
      },
      skills: job.category?.tag || [],
      postedAt: new Date(job.created).toISOString(),
      location: job.location?.display_name || 'Remote',
      company: {
        name: job.company?.display_name,
        logo: job.company?.logo_url,
      },
      source: 'Adzuna',
      category: mapCategory(
        'Adzuna',
        job.category?.tag || job.category,
        job.title,
        job.description
      ),
      tradeType: 'Job',
    }));
  } catch (error) {
    console.error('Error fetching Adzuna jobs:', error);
    return [];
  }
};

// Add Reed as a reliable source
const _fetchReedJobs = async (): Promise<AggregatedGig[]> => {
  try {
    const feed = await safeFetchAPI('https://www.reed.co.uk/api/1.0/search', 'Reed', {
      errorHandler: (error: APIError) => {
        if (error.response?.status === 429) {
          console.warn('Reed rate limit exceeded, waiting before retry');
          return false;
        }
        return false;
      },
      normalizer: (data: any) => {
        if (!data?.results) return [];
        return data.results.map((job: any) => ({
          id: `reed-${job.jobId}`,
          title: job.jobTitle,
          description: job.jobDescription,
          url: job.jobUrl,
          budget: {
            amount: job.minimumSalary || 0,
            currency: 'GBP',
            type: job.salaryType || 'hourly',
          },
          skills: job.keywords || [],
          postedAt: new Date(job.datePosted).toISOString(),
          location: job.locationName || 'Remote',
          company: {
            name: job.employerName,
            logo: job.employerLogo,
          },
          source: 'Reed',
          category: mapCategory('Reed', job.category || job.jobTitle),
          tradeType: 'Job',
        }));
      },
    });
    return feed;
  } catch (error) {
    console.error('Error fetching Reed jobs:', error);
    return [];
  }
};

// --- RELIABLE PUBLIC SOURCES ---
import { fetchFreelancerGigs } from './fetchers/freelancer';
import { fetchWeWorkRemotelyGigs } from './fetchers/weworkremotely';
import { fetchRemoteOKGigs } from './fetchers/remoteok';
import { fetchProBloggerGigs } from './fetchers/problogger';
// Add more as needed

// --- Remotive Fetcher (Public API, No Key Required) ---

// Map Remotive categories to UI categories
function mapRemotiveCategory(remotiveCategory: string): string {
  switch (remotiveCategory) {
    case 'Software Development':
    case 'DevOps / Sysadmin':
    case 'Data':
    case 'Data Analysis':
    case 'Product':
    case 'Project Management':
      return 'Web Dev / Tech';
    case 'Marketing':
      return 'Marketing';
    case 'Writing':
      return 'Copywriting';
    case 'Design':
      return 'UX/UI & Design';
    case 'Sales':
    case 'Sales / Business':
      return 'Sales / Business';
    case 'Customer Service':
      return 'Customer Service';
    case 'Finance / Legal':
      return 'Finance / Legal';
    case 'All others':
      return 'Other';
    default:
      return 'Other';
  }
}

export async function fetchRemotiveGigs(limit = 50, category?: string) {
  const params: Record<string, string | number> = { limit };
  if (category) params.category = category;
  const url = 'https://remotive.com/api/remote-jobs';
  const response = await axios.get(url, { params });
  const jobs = response.data.jobs || [];
  // Debug: log all unique Remotive categories fetched
  const uniqueRemotiveCategories = Array.from(new Set(jobs.map((job: any) => job.category)));
  console.log('[Remotive] Unique categories fetched:', uniqueRemotiveCategories);
  return jobs.map((job: any) => ({
    id: `remotive-${job.id}`,
    title: job.title,
    description: job.description,
    link: job.url,
    source: 'Remotive',
    category: mapRemotiveCategory(job.category),
    tradeType: job.job_type || 'remote',
    location: job.candidate_required_location || '',
    postedAt: job.publication_date
      ? new Date(job.publication_date).toISOString()
      : new Date().toISOString(),
    expiresAt: undefined,
    company: job.company_name,
    companyLogo: job.company_logo,
    salary: job.salary,
  }));
}

// Wrap each fetcher in gigSourceMap with debug logging
function withDebugLogging(
  fetcher: () => Promise<AggregatedGig[]>,
  sourceName: string,
  category: string
) {
  const wrapped = async () => {
    console.log(`[${sourceName}] Fetching jobs for category: ${category}`);
    const jobs = await fetcher();
    console.log(`[${sourceName}] Jobs fetched for ${category}: ${jobs.length}`);
    if (jobs.length > 0) {
      console.log(`[${sourceName}] Sample job for ${category}:`, jobs[0]);
    }
    return jobs;
  };
  (wrapped as any).sourceName = sourceName;
  return wrapped;
}

// --- Only use Adzuna for now ---
export const gigSourceMap: Record<string, Array<() => Promise<AggregatedGig[]>>> = {
  'Web Dev / Tech': [
    withDebugLogging(_fetchAdzunaJobs, 'Adzuna', 'Web Dev / Tech'),
    withDebugLogging(_fetchIndeedJobs, 'Indeed', 'Web Dev / Tech'),
    withDebugLogging(_fetchZipRecruiterJobs, 'ZipRecruiter', 'Web Dev / Tech'),
    withDebugLogging(_fetchReedJobs, 'Reed', 'Web Dev / Tech'),
    withDebugLogging(fetchRemotiveGigs, 'Remotive', 'Web Dev / Tech'),
    withDebugLogging(fetchFreelancerGigs, 'Freelancer', 'Web Dev / Tech'),
    withDebugLogging(fetchWeWorkRemotelyGigs, 'WeWorkRemotely', 'Web Dev / Tech'),
    withDebugLogging(fetchRemoteOKGigs, 'RemoteOK', 'Web Dev / Tech'),
    withDebugLogging(fetchProBloggerGigs, 'ProBlogger', 'Web Dev / Tech'),
    withDebugLogging(fetchMonsterGigs, 'Monster', 'Web Dev / Tech'),
    withDebugLogging(fetchCareerjetJobs, 'Careerjet', 'Web Dev / Tech'),
    withDebugLogging(fetchJobicyJobs, 'Jobicy', 'Web Dev / Tech'),
  ],
  'Healthcare & Nursing Jobs': [
    withDebugLogging(_fetchAdzunaJobs, 'Adzuna', 'Healthcare & Nursing Jobs'),
    withDebugLogging(_fetchIndeedJobs, 'Indeed', 'Healthcare & Nursing Jobs'),
    withDebugLogging(_fetchZipRecruiterJobs, 'ZipRecruiter', 'Healthcare & Nursing Jobs'),
    withDebugLogging(_fetchReedJobs, 'Reed', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchRemotiveGigs, 'Remotive', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchFreelancerGigs, 'Freelancer', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchWeWorkRemotelyGigs, 'WeWorkRemotely', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchRemoteOKGigs, 'RemoteOK', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchProBloggerGigs, 'ProBlogger', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchMonsterGigs, 'Monster', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchCareerjetJobs, 'Careerjet', 'Healthcare & Nursing Jobs'),
    withDebugLogging(fetchJobicyJobs, 'Jobicy', 'Healthcare & Nursing Jobs'),
  ],
  'Catering & Food': [
    withDebugLogging(_fetchAdzunaJobs, 'Adzuna', 'Catering & Food'),
    withDebugLogging(_fetchIndeedJobs, 'Indeed', 'Catering & Food'),
    withDebugLogging(_fetchZipRecruiterJobs, 'ZipRecruiter', 'Catering & Food'),
    withDebugLogging(_fetchReedJobs, 'Reed', 'Catering & Food'),
    withDebugLogging(fetchRemotiveGigs, 'Remotive', 'Catering & Food'),
    withDebugLogging(fetchFreelancerGigs, 'Freelancer', 'Catering & Food'),
    withDebugLogging(fetchWeWorkRemotelyGigs, 'WeWorkRemotely', 'Catering & Food'),
    withDebugLogging(fetchRemoteOKGigs, 'RemoteOK', 'Catering & Food'),
    withDebugLogging(fetchProBloggerGigs, 'ProBlogger', 'Catering & Food'),
    withDebugLogging(fetchMonsterGigs, 'Monster', 'Catering & Food'),
    withDebugLogging(fetchCareerjetJobs, 'Careerjet', 'Catering & Food'),
    withDebugLogging(fetchJobicyJobs, 'Jobicy', 'Catering & Food'),
  ],
  Sales: [
    withDebugLogging(_fetchAdzunaJobs, 'Adzuna', 'Sales'),
    withDebugLogging(_fetchIndeedJobs, 'Indeed', 'Sales'),
    withDebugLogging(_fetchZipRecruiterJobs, 'ZipRecruiter', 'Sales'),
    withDebugLogging(_fetchReedJobs, 'Reed', 'Sales'),
    withDebugLogging(fetchRemotiveGigs, 'Remotive', 'Sales'),
    withDebugLogging(fetchFreelancerGigs, 'Freelancer', 'Sales'),
    withDebugLogging(fetchWeWorkRemotelyGigs, 'WeWorkRemotely', 'Sales'),
    withDebugLogging(fetchRemoteOKGigs, 'RemoteOK', 'Sales'),
    withDebugLogging(fetchProBloggerGigs, 'ProBlogger', 'Sales'),
    withDebugLogging(fetchMonsterGigs, 'Monster', 'Sales'),
    withDebugLogging(fetchCareerjetJobs, 'Careerjet', 'Sales'),
    withDebugLogging(fetchJobicyJobs, 'Jobicy', 'Sales'),
  ],
  'Construction & Trades': [
    withDebugLogging(_fetchAdzunaJobs, 'Adzuna', 'Construction & Trades'),
    withDebugLogging(_fetchIndeedJobs, 'Indeed', 'Construction & Trades'),
    withDebugLogging(_fetchZipRecruiterJobs, 'ZipRecruiter', 'Construction & Trades'),
    withDebugLogging(_fetchReedJobs, 'Reed', 'Construction & Trades'),
    withDebugLogging(fetchRemotiveGigs, 'Remotive', 'Construction & Trades'),
    withDebugLogging(fetchFreelancerGigs, 'Freelancer', 'Construction & Trades'),
    withDebugLogging(fetchWeWorkRemotelyGigs, 'WeWorkRemotely', 'Construction & Trades'),
    withDebugLogging(fetchRemoteOKGigs, 'RemoteOK', 'Construction & Trades'),
    withDebugLogging(fetchProBloggerGigs, 'ProBlogger', 'Construction & Trades'),
    withDebugLogging(fetchMonsterGigs, 'Monster', 'Construction & Trades'),
    withDebugLogging(fetchCareerjetJobs, 'Careerjet', 'Construction & Trades'),
    withDebugLogging(fetchJobicyJobs, 'Jobicy', 'Construction & Trades'),
  ],
  'Teaching jobs': [
    withDebugLogging(_fetchAdzunaJobs, 'Adzuna', 'Teaching jobs'),
    withDebugLogging(_fetchIndeedJobs, 'Indeed', 'Teaching jobs'),
    withDebugLogging(_fetchZipRecruiterJobs, 'ZipRecruiter', 'Teaching jobs'),
    withDebugLogging(_fetchReedJobs, 'Reed', 'Teaching jobs'),
    withDebugLogging(fetchRemotiveGigs, 'Remotive', 'Teaching jobs'),
    withDebugLogging(fetchFreelancerGigs, 'Freelancer', 'Teaching jobs'),
    withDebugLogging(fetchWeWorkRemotelyGigs, 'WeWorkRemotely', 'Teaching jobs'),
    withDebugLogging(fetchRemoteOKGigs, 'RemoteOK', 'Teaching jobs'),
    withDebugLogging(fetchProBloggerGigs, 'ProBlogger', 'Teaching jobs'),
    withDebugLogging(fetchMonsterGigs, 'Monster', 'Teaching jobs'),
    withDebugLogging(fetchCareerjetJobs, 'Careerjet', 'Teaching jobs'),
    withDebugLogging(fetchJobicyJobs, 'Jobicy', 'Teaching jobs'),
  ],
  'Driving Jobs': [
    withDebugLogging(_fetchAdzunaJobs, 'Adzuna', 'Driving Jobs'),
    withDebugLogging(_fetchIndeedJobs, 'Indeed', 'Driving Jobs'),
    withDebugLogging(_fetchZipRecruiterJobs, 'ZipRecruiter', 'Driving Jobs'),
    withDebugLogging(_fetchReedJobs, 'Reed', 'Driving Jobs'),
    withDebugLogging(fetchRemotiveGigs, 'Remotive', 'Driving Jobs'),
    withDebugLogging(fetchFreelancerGigs, 'Freelancer', 'Driving Jobs'),
    withDebugLogging(fetchWeWorkRemotelyGigs, 'WeWorkRemotely', 'Driving Jobs'),
    withDebugLogging(fetchRemoteOKGigs, 'RemoteOK', 'Driving Jobs'),
    withDebugLogging(fetchProBloggerGigs, 'ProBlogger', 'Driving Jobs'),
    withDebugLogging(fetchMonsterGigs, 'Monster', 'Driving Jobs'),
    withDebugLogging(fetchCareerjetJobs, 'Careerjet', 'Driving Jobs'),
    withDebugLogging(fetchJobicyJobs, 'Jobicy', 'Driving Jobs'),
  ],
};

// Utility: Get all unique job source names from gigSourceMap
export const jobSourceList: string[] = Array.from(
  new Set(
    Object.values(gigSourceMap)
      .flat()
      .map(fn => (fn as any).sourceName)
  )
)
  .filter(Boolean)
  .sort((a, b) => a.localeCompare(b));

// --- SCHEMA NORMALIZATION & PRISMA PREP ---

// Updated gig type to match integration guide
export type NormalizedGig = {
  id: string;
  title: string;
  description?: string;
  link: string;
  source: string;
  category: string;
  tradeType: string;
  location?: string;
  postedAt: string;
  expiresAt?: string;
  [key: string]: any;
};

// Utility: Normalize a gig object to the schema
export function normalizeGig(
  raw: any,
  source: string,
  category: string,
  tradeType: string
): NormalizedGig {
  // Normalize location: if comma-separated, normalize country part
  let location = raw.location || '';
  if (location && typeof location === 'string') {
    const parts = location.split(',').map(p => p.trim());
    if (parts.length > 1) {
      // Assume last part is country
      const country = normalizeCountryName(parts[parts.length - 1]);
      parts[parts.length - 1] = country;
      location = parts.join(', ');
    } else if (parts.length === 1) {
      location = normalizeCountryName(parts[0]);
    }
  }
  // Patch: enforce valid category and source
  let patchedCategory =
    category && category.toLowerCase() !== 'other' && category.trim() !== ''
      ? category
      : raw.category || 'General';
  if (
    !patchedCategory ||
    patchedCategory.toLowerCase() === 'other' ||
    patchedCategory.trim() === ''
  ) {
    patchedCategory = 'General';
  }
  let patchedSource =
    source && source.toLowerCase() !== 'unknown' && source.trim() !== ''
      ? source
      : raw.source || 'Aggregated';
  if (!patchedSource || patchedSource.toLowerCase() === 'unknown' || patchedSource.trim() === '') {
    patchedSource = 'Aggregated';
  }
  return {
    id: raw.id
      ? String(raw.id)
      : `${patchedSource}-${raw.title?.slice(0, 20)}-${raw.url || raw.link}`,
    title: raw.title || raw.name || 'Untitled',
    description: raw.description || '',
    link: raw.url || raw.link || '',
    source: patchedSource,
    category: patchedCategory,
    tradeType,
    location,
    postedAt: raw.postedAt || raw.pubDate || new Date().toISOString(),
    expiresAt: raw.expiresAt || undefined,
    ...raw,
  };
}

// Utility: De-duplicate gigs by title+link+source
export function dedupeGigs(gigs: NormalizedGig[]): NormalizedGig[] {
  const seen = new Set<string>();
  return gigs.filter(gig => {
    const key = `${gig.title}|${gig.link}|${gig.source}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Utility: Filter out gigs older than 48 hours (unless evergreen)
export function filterFreshGigs(gigs: NormalizedGig[]): NormalizedGig[] {
  const now = Date.now();
  const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
  return gigs.filter(gig => {
    if (gig.expiresAt) return true; // keep evergreen
    const posted = new Date(gig.postedAt).getTime();
    return now - posted <= FORTY_EIGHT_HOURS;
  });
}

// --- PRISMA CLIENT INSTANTIATION ---
import { prisma } from '@/lib/prisma';

// --- PRISMA DB SAVE ---
export async function saveGigsToDb(gigs: NormalizedGig[]): Promise<void> {
  for (const gig of gigs) {
    const postedAt = gig.postedAt ? new Date(gig.postedAt) : new Date();
    const expiresAt = gig.expiresAt ? new Date(gig.expiresAt) : addDays(postedAt, 21);
    await prisma.gig.upsert({
      where: { link: gig.link },
      update: {
        title: gig.title,
        description: gig.description,
        source: gig.source,
        category: gig.category,
        tradeType: gig.tradeType,
        location: gig.location,
        postedAt,
        expiresAt,
      },
      create: {
        id: gig.id,
        title: gig.title,
        description: gig.description,
        link: gig.link,
        source: gig.source,
        category: gig.category,
        tradeType: gig.tradeType,
        location: gig.location,
        postedAt,
        expiresAt,
      },
    });
  }
}

// --- FETCH RECENT GIGS FOR UI ---
export async function getRecentGigsFromDb(limit = 50) {
  return prisma.gig.findMany({
    where: {
      postedAt: {
        gte: new Date(Date.now() - 48 * 60 * 60 * 1000), // last 48 hours
      },
    },
    orderBy: { postedAt: 'desc' },
    take: limit,
  });
}

// --- MAIN AGGREGATION ENTRYPOINT (EXAMPLE) ---
// (Wrap your main gig aggregation here for future DB integration)
export async function removeExpiredGigs() {
  const now = new Date();
  const result = await prisma.gig.deleteMany({
    where: {
      expiresAt: { lte: now },
    },
  });
  console.log(`[Cleanup] Removed ${result.count} expired gigs.`);
}

export async function aggregateAndStoreGigs() {
  // Remove expired gigs before aggregation
  await removeExpiredGigs();
  // Example: aggregate all categories
  const allGigs: NormalizedGig[] = [];
  const summary: Record<string, Record<string, number>> = {};
  for (const [category, fetchFns] of Object.entries(gigSourceMap)) {
    for (const fetchFn of fetchFns) {
      const jobs = await fetchFn();
      const source = jobs[0]?.source || 'unknown';
      if (!summary[category]) summary[category] = {};
      summary[category][source] = (summary[category][source] || 0) + jobs.length;
      // You may want to map tradeType/category more specifically per source
      const normalized = jobs.map(gig =>
        normalizeGig(gig, gig.source || 'unknown', category, category)
      );
      allGigs.push(...normalized);
    }
  }
  const deduped = dedupeGigs(allGigs);
  const fresh = filterFreshGigs(deduped);
  await saveGigsToDb(fresh);
  console.log('--- Aggregation Summary ---');
  Object.entries(summary).forEach(([cat, sources]) => {
    console.log(`Category: ${cat}`);
    Object.entries(sources).forEach(([src, count]) => {
      console.log(`  Source: ${src} - Jobs: ${count}`);
    });
  });
  return fresh;
}

// Remove unused source functions and keep only reliable ones
const _fetchWorkingNomadsJobs = async (): Promise<AggregatedGig[]> => {
  try {
    const feed = await safeFetchAPI(
      'https://www.workingnomads.com/api/exposed_jobs/',
      'Working Nomads',
      {
        errorHandler: (error: APIError) => {
          if (error.response?.status === 429) {
            console.warn('Working Nomads rate limit exceeded, waiting before retry');
            return false;
          }
          return false;
        },
      }
    );
    return feed;
  } catch (error) {
    console.error('Error fetching Working Nomads jobs:', error);
    return [];
  }
};

const _fetchRemotiveJobs = async (): Promise<AggregatedGig[]> => {
  try {
    const feed = await safeFetchAPI('https://remotive.com/api/remote-jobs', 'Remotive', {
      errorHandler: (error: APIError) => {
        if (error.response?.status === 429) {
          console.warn('Remotive rate limit exceeded, waiting before retry');
          return false;
        }
        return false;
      },
    });
    return feed;
  } catch (error) {
    console.error('Error fetching Remotive jobs:', error);
    return [];
  }
};

// TODO: PeoplePerHour API currently unavailable. Add fetcher when API/docs are back online.
