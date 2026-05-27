import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { scrapeRss, Keyword, RawMentionInput } from './scrapers/rss';
import { scrapeYoutubeChannel } from './scrapers/youtube';
import { scrapeUrlScraping } from './scrapers/playwright';
import { processMentions } from './processors/aiProcessor';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const youtubeApiKey = process.env.YOUTUBE_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[Worker] Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment.');
  process.exit(1);
}

// Cliente de Supabase con Service Role para evadir políticas de RLS durante la ingesta cruda
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('[Worker] Starting automated listening cycle...');
  
  try {
    // 1. Obtener todas las fuentes de ingesta activas
    console.log('[Worker] Fetching active sources configuration...');
    const { data: sources, error: sourcesError } = await supabase
      .from('sources_config')
      .select('*')
      .eq('is_active', true);
      
    if (sourcesError) {
      throw new Error(`Failed to retrieve sources: ${sourcesError.message}`);
    }
    
    console.log(`[Worker] Found ${sources?.length || 0} active sources to scan.`);
    if (!sources || sources.length === 0) {
      console.log('[Worker] No active sources found in database. Ending cycle.');
      return;
    }
    
    // 2. Agrupar palabras clave por marca para optimizar consultas a la base de datos
    const brandIds = Array.from(new Set(sources.map(s => s.brand_id)));
    const keywordsByBrand: Record<string, Keyword[]> = {};
    
    console.log('[Worker] Resolving brand keyword filters...');
    for (const brandId of brandIds) {
      const { data: kws, error: kwsError } = await supabase
        .from('keywords')
        .select('term, exclusion_terms')
        .eq('brand_id', brandId);
        
      if (kwsError) {
        console.error(`[Worker] Error fetching keywords for brand ${brandId}:`, kwsError.message);
        keywordsByBrand[brandId] = [];
      } else {
        keywordsByBrand[brandId] = (kws || []).map(k => ({
          term: k.term,
          exclusion_terms: k.exclusion_terms || []
        }));
      }
    }
    
    // 3. Procesar secuencialmente cada fuente
    let totalAdded = 0;
    
    for (const source of sources) {
      const { id: sourceId, brand_id: brandId, type, url_target: url } = source;
      const keywords = keywordsByBrand[brandId] || [];
      
      console.log(`\n[Worker] Running scan for source [${type}] - target: ${url}`);
      
      let mentions: RawMentionInput[] = [];
      
      try {
        switch (type) {
          case 'rss_google':
          case 'rss_reddit':
            mentions = await scrapeRss(url, brandId, type, keywords);
            break;
          case 'youtube_channel':
            mentions = await scrapeYoutubeChannel(url, brandId, keywords, youtubeApiKey);
            break;
          case 'url_scraping':
            mentions = await scrapeUrlScraping(url, brandId, keywords);
            break;
          default:
            console.warn(`[Worker] Unsupported source type ignored: ${type}`);
        }
      } catch (err: any) {
        console.error(`[Worker] Error during scan of source ${sourceId}:`, err.message || err);
      }
      
      if (mentions.length > 0) {
        console.log(`[Worker] Saving ${mentions.length} matched raw mentions to Supabase...`);
        const { error: insertError } = await supabase
          .from('raw_mentions')
          .insert(mentions);
          
        if (insertError) {
          console.error(`[Worker] Database insert error for source ${sourceId}:`, insertError.message);
        } else {
          totalAdded += mentions.length;
          console.log(`[Worker] Saved ${mentions.length} mentions successfully.`);
        }
      } else {
        console.log(`[Worker] No matches found for source ${sourceId}.`);
      }
    }
    
    console.log(`\n[Worker] Scraper cycle completed successfully. Total raw mentions saved: ${totalAdded}`);

    // Iniciar el procesamiento de clasificación con IA automáticamente al finalizar el scraping
    console.log('\n[Worker] Triggering AI classification cycle for raw mentions...');
    await processMentions();
  } catch (error: any) {
    console.error('[Worker] Fatal execution error in scraper worker:', error.message || error);
    process.exit(1);
  }
}

main();
