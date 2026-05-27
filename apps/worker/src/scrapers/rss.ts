import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

export interface Keyword {
  term: string;
  exclusion_terms: string[];
}

export interface RawMentionInput {
  brand_id: string;
  source_name: string;
  content_raw: string;
  source_url?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function matchesKeywords(text: string, keywords: Keyword[]): boolean {
  if (keywords.length === 0) return true;
  const lowercaseText = text.toLowerCase();
  
  return keywords.some(kw => {
    const termMatches = lowercaseText.includes(kw.term.toLowerCase());
    if (!termMatches) return false;
    
    const exclusionMatches = kw.exclusion_terms.some(ex => 
      ex.trim() !== '' && lowercaseText.includes(ex.toLowerCase())
    );
    return !exclusionMatches;
  });
}

export async function scrapeRss(
  url: string,
  brandId: string,
  sourceType: 'rss_google' | 'rss_reddit',
  keywords: Keyword[]
): Promise<RawMentionInput[]> {
  try {
    let targetUrl = url;
    if (sourceType === 'rss_reddit') {
      // Formato: https://www.reddit.com/r/subreddit/.rss o https://www.reddit.com/r/subreddit.rss
      const urlObj = new URL(url);
      if (!urlObj.pathname.endsWith('.rss')) {
        urlObj.pathname = urlObj.pathname.replace(/\/$/, '') + '.rss';
      }
      targetUrl = urlObj.toString();
    }

    console.log(`[RSS Scraper] Fetching feed from: ${targetUrl}`);
    const feed = await parser.parseURL(targetUrl);
    const mentions: RawMentionInput[] = [];

    for (const item of feed.items) {
      const title = item.title || '';
      const content = stripHtml(item.content || item.contentSnippet || '');
      const fullText = `${title}\n\n${content}`;

      if (matchesKeywords(fullText, keywords)) {
        mentions.push({
          brand_id: brandId,
          source_name: sourceType === 'rss_google' ? 'Google Alerts' : 'Reddit',
          content_raw: fullText,
          source_url: item.link || item.guid || undefined
        });
      }
    }

    console.log(`[RSS Scraper] Found ${mentions.length} matching mentions for brand ${brandId}`);
    return mentions;
  } catch (error) {
    console.error(`[RSS Scraper] Error scraping RSS feed from ${url}:`, error);
    return [];
  }
}
