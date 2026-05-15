import Parser from 'rss-parser';
import { mapCategory } from '../category-mapping';

export async function fetchWeWorkRemotelyGigs(): Promise<any[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(
    'https://weworkremotely.com/categories/remote-programming-jobs.rss'
  );
  return feed.items.map(item => ({
    id: item.guid || item.link || item.title,
    title: item.title,
    description: item.contentSnippet || item.content || '',
    url: item.link,
    postedAt: item.pubDate,
    source: 'WeWorkRemotely',
    category: mapCategory('WeWorkRemotely', item.category || item.title),
    tradeType: 'Remote',
    location: 'Remote',
  }));
}
