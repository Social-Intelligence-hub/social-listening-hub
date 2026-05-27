import { chromium } from 'playwright';
import { Keyword, RawMentionInput, matchesKeywords } from './rss';

interface SelectorMap {
  container: string;
  title: string;
  content: string;
  link?: string;
}

// Selector mapping for known domains, with default fallback
const SELECTORS_MAPPING: Record<string, SelectorMap> = {
  'example.com': {
    container: 'div.article-container',
    title: 'h2.article-title',
    content: 'div.article-body',
    link: 'a.article-link'
  },
  'default': {
    container: 'article, .post, .entry, .article-card, .news-item',
    title: 'h1, h2, h3, .title, .entry-title',
    content: 'p, .content, .entry-content, .body-text',
    link: 'a'
  }
};

export async function scrapeUrlScraping(
  url: string,
  brandId: string,
  keywords: Keyword[]
): Promise<RawMentionInput[]> {
  console.log(`[Playwright Scraper] Starting browser crawl for: ${url}`);
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const selector = SELECTORS_MAPPING[domain] || SELECTORS_MAPPING['default'];

    const scrapedItems = await page.evaluate((sel) => {
      const items: { title: string; content: string; url?: string }[] = [];
      const containers = document.querySelectorAll(sel.container);

      containers.forEach(el => {
        const titleEl = el.querySelector(sel.title);
        const contentEls = el.querySelectorAll(sel.content);
        let contentText = '';
        contentEls.forEach(c => {
          contentText += ' ' + (c.textContent || '').trim();
        });
        
        const title = titleEl ? (titleEl.textContent || '').trim() : '';
        const content = contentText.trim();
        
        let itemUrl: string | undefined = undefined;
        if (sel.link) {
          const linkEl = el.querySelector(sel.link) as HTMLAnchorElement | null;
          if (linkEl && linkEl.href) {
            itemUrl = linkEl.href;
          }
        }

        if (title || content) {
          items.push({ title, content, url: itemUrl });
        }
      });

      // Si no se encontraron contenedores específicos, extraemos el contenido general de la página
      if (items.length === 0) {
        const title = document.title || '';
        const bodyContent = Array.from(document.querySelectorAll('p, article'))
          .map(el => (el.textContent || '').trim())
          .filter(t => t.length > 30)
          .join('\n');
        items.push({ title, content: bodyContent, url: window.location.href });
      }

      return items;
    }, selector);

    const mentions: RawMentionInput[] = [];
    for (const item of scrapedItems) {
      const fullText = `${item.title}\n\n${item.content}`;
      if (matchesKeywords(fullText, keywords)) {
        // Normalizar URL relativa si es necesario
        let itemUrl = item.url || url;
        if (itemUrl.startsWith('/')) {
          itemUrl = new URL(itemUrl, url).toString();
        }
        mentions.push({
          brand_id: brandId,
          source_name: 'Web Scraping',
          content_raw: fullText,
          source_url: itemUrl
        });
      }
    }

    console.log(`[Playwright Scraper] Extracted ${mentions.length} matching mentions from ${url}`);
    return mentions;
  } catch (error) {
    console.error(`[Playwright Scraper] Error scraping ${url}:`, error);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
