import axios from 'axios';
import { xml2js } from 'xml-js';
import { prisma } from '@/lib/prisma';
import Parser from 'rss-parser';
import { mapCategory } from '../category-mapping';
import { addDays } from 'date-fns';
import {
  DEFAULT_AGGREGATED_GIG_TRADE_TYPE,
  getAggregatorUserIdForGigs,
} from '@/lib/aggregation/gig-persist';

export async function fetchRemoteOKWebGigs() {
  const userId = getAggregatorUserIdForGigs();
  if (!userId) {
    console.warn('[RemoteOK] AGGREGATOR_USER_ID is not set; skipping gig persistence.');
    return;
  }

  const feedUrl = 'https://remoteok.com/remote-dev-jobs.rss';
  const res = await axios.get(feedUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      Accept: 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8',
    },
    maxRedirects: 5,
  });
  const feed = xml2js(res.data, { compact: true }) as any;
  const jobs = feed.rss.channel.item;

  for (const job of jobs) {
    const title = job.title._text;
    const description = job.description._text;
    const url = job.link._text;
    let category = 'Web Dev';
    if (!category || category.trim() === '' || category.toLowerCase() === 'other') {
      category = 'General';
    }
    let source = 'RemoteOK';
    if (!source || source.trim() === '' || source.toLowerCase() === 'unknown') {
      source = 'RemoteOK';
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
}

export async function fetchRemoteOKGigs(): Promise<any[]> {
  const parser = new Parser();
  const feed = await parser.parseURL('https://remoteok.com/remote-dev-jobs.rss');
  return feed.items.map(item => ({
    id: item.guid || item.link || item.title,
    title: item.title,
    description: item.contentSnippet || item.content || '',
    url: item.link,
    postedAt: item.pubDate,
    source: 'RemoteOK',
    category: mapCategory('RemoteOK', item.category || item.title),
    tradeType: 'Remote',
    location: 'Remote',
    expiresAt: addDays(item.pubDate ? new Date(item.pubDate) : new Date(), 21),
  }));
}
