import axios from 'axios';
import { xml2js } from 'xml-js';
import { prisma } from '@/lib/prisma';
import { mapCategory } from '../category-mapping';
import { addDays } from 'date-fns';
import {
  DEFAULT_AGGREGATED_GIG_TRADE_TYPE,
  getAggregatorUserIdForGigs,
} from '@/lib/aggregation/gig-persist';
import type { AggregatedGig } from '@/lib/aggregation/gig-sources';

export async function fetchProBloggerGigs(): Promise<AggregatedGig[]> {
  const userId = getAggregatorUserIdForGigs();
  if (!userId) {
    console.warn('[ProBlogger] AGGREGATOR_USER_ID is not set; skipping gig persistence.');
    return [];
  }

  const feedUrl = 'https://problogger.com/jobs/feed/';
  const res = await axios.get(feedUrl);
  const feed = xml2js(res.data, { compact: true }) as any;
  const jobs = feed.rss.channel.item;

  for (const job of jobs) {
    const title = job.title._text;
    const description = job.description._text;
    const url = job.link._text;
    let category = mapCategory('ProBlogger', job.category?._text || job.title?._text);
    if (!category || category.trim() === '' || category.toLowerCase() === 'other') {
      category = 'General';
    }
    let source = 'ProBlogger';
    if (!source || source.trim() === '' || source.toLowerCase() === 'unknown') {
      source = 'ProBlogger';
    }
    const tags = job.category
      ? Array.isArray(job.category)
        ? job.category.map((c: any) => c._text)
        : [job.category._text]
      : [];
    const postedAt = job.pubDate ? new Date(job.pubDate) : new Date();
    const expiresAt = addDays(postedAt, 21);
    await prisma.gig.upsert({
      where: { link: url },
      update: {
        title,
        description,
        source,
        category,
        tradeType: DEFAULT_AGGREGATED_GIG_TRADE_TYPE,
        postedAt,
        expiresAt,
      },
      create: {
        title,
        description,
        link: url,
        source,
        category,
        tradeType: DEFAULT_AGGREGATED_GIG_TRADE_TYPE,
        userId,
        postedAt,
        expiresAt,
      },
    });
  }

  return [];
}
