import { YoutubeTranscript } from 'youtube-transcript';
import { Keyword, RawMentionInput, matchesKeywords } from './rss';

export async function scrapeYoutubeChannel(
  urlTarget: string,
  brandId: string,
  keywords: Keyword[],
  apiKey?: string
): Promise<RawMentionInput[]> {
  if (!apiKey) {
    console.warn('[YouTube Scraper] YouTube API Key not found in environment variables. Skipping YouTube scraping.');
    return [];
  }
  
  // Extraer el ID de canal o handle de la URL o el string de target
  let channelIdOrHandle = urlTarget.trim();
  if (urlTarget.includes('youtube.com/')) {
    const parts = urlTarget.split('youtube.com/');
    const path = parts[1];
    if (path.startsWith('channel/')) {
      channelIdOrHandle = path.split('/')[1].split(/[?#]/)[0];
    } else if (path.startsWith('@')) {
      channelIdOrHandle = path.split('/')[0].split(/[?#]/)[0];
    }
  }

  try {
    let channelId = '';
    let uploadPlaylistId = '';

    // Si empieza por UC es directamente un ID de canal
    if (channelIdOrHandle.startsWith('UC')) {
      channelId = channelIdOrHandle;
      uploadPlaylistId = 'UU' + channelId.substring(2);
    } else {
      // Si es un handle (ej: @username), llamamos a la API de canales de YouTube
      const handle = channelIdOrHandle.startsWith('@') ? channelIdOrHandle : `@${channelIdOrHandle}`;
      console.log(`[YouTube Scraper] Resolving handle ${handle} to channel ID...`);
      const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&forHandle=${encodeURIComponent(handle)}&part=contentDetails,id`;
      const chRes = await fetch(channelsUrl);
      if (!chRes.ok) {
        throw new Error(`Failed to fetch channel details for handle ${handle}: ${chRes.statusText}`);
      }
      const chData: any = await chRes.json();
      if (!chData.items || chData.items.length === 0) {
        console.warn(`[YouTube Scraper] Channel not found for handle ${handle}`);
        return [];
      }
      channelId = chData.items[0].id;
      uploadPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads;
    }

    console.log(`[YouTube Scraper] Fetching latest videos from uploads playlist: ${uploadPlaylistId}`);
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${uploadPlaylistId}&part=snippet&maxResults=5`;
    const plRes = await fetch(playlistUrl);
    if (!plRes.ok) {
      throw new Error(`Failed to fetch playlist items: ${plRes.statusText}`);
    }
    const plData: any = await plRes.json();
    const items = plData.items || [];
    
    const mentions: RawMentionInput[] = [];

    for (const item of items) {
      const videoId = item.snippet.resourceId.videoId;
      const videoTitle = item.snippet.title || '';
      const videoDescription = item.snippet.description || '';
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      console.log(`[YouTube Scraper] Fetching transcript for video: ${videoTitle} (${videoId})`);
      let transcriptText = '';
      try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'es' });
        transcriptText = transcriptItems.map(t => t.text).join(' ');
      } catch (err: any) {
        console.warn(`[YouTube Scraper] Could not fetch Spanish transcript for video ${videoId}, trying default:`, err.message);
        try {
          const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
          transcriptText = transcriptItems.map(t => t.text).join(' ');
        } catch (innerErr: any) {
          console.warn(`[YouTube Scraper] Could not fetch any transcript for video ${videoId}:`, innerErr.message);
        }
      }

      const fullContent = `Título: ${videoTitle}\nDescripción: ${videoDescription}\n\nTranscripción:\n${transcriptText || '(Sin transcripción disponible)'}`;

      // Comprobamos palabras clave
      if (matchesKeywords(fullContent, keywords)) {
        mentions.push({
          brand_id: brandId,
          source_name: 'YouTube',
          content_raw: fullContent,
          source_url: videoUrl
        });
      }
    }

    console.log(`[YouTube Scraper] Found ${mentions.length} matching video mentions for brand ${brandId}`);
    return mentions;
  } catch (error) {
    console.error(`[YouTube Scraper] Error scraping channel ${urlTarget}:`, error);
    return [];
  }
}
