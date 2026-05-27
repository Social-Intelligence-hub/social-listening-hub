import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Cargar variables de entorno
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[AI Processor] Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Leer instrucciones base del agente
const promptPath = path.join(__dirname, '../prompts/sentiment_agent.txt');
const systemInstruction = fs.readFileSync(promptPath, 'utf8');

// Definición del esquema JSON de salida para obligar a Gemini a cumplirlo
const sentimentResponseSchema = {
  type: 'object',
  properties: {
    cleaned_content: { type: 'string' },
    sentiment: { type: 'string', enum: ['positivo', 'neutro', 'negativo'] },
    justification: { type: 'string' },
    is_crisis_alert: { type: 'boolean' }
  },
  required: ['cleaned_content', 'sentiment', 'justification', 'is_crisis_alert']
};

export async function processMentions() {
  if (!ai) {
    console.warn('[AI Processor] GEMINI_API_KEY is not defined in environment. Skipping AI classification cycle.');
    return;
  }

  console.log('[AI Processor] Starting AI processing cycle...');
  
  try {
    // 1. Obtener menciones crudas con su respectivo estado de procesamiento
    console.log('[AI Processor] Fetching unprocessed raw mentions...');
    const { data: rawMentions, error: fetchError } = await supabase
      .from('raw_mentions')
      .select('id, brand_id, content_raw, source_url, processed_mentions(id)');

    if (fetchError) {
      throw new Error(`Failed to fetch raw mentions: ${fetchError.message}`);
    }

    // Filtrar aquellas que no tengan correspondencia en processed_mentions
    const unprocessed = (rawMentions || []).filter(rm => {
      const pm = rm.processed_mentions;
      return !pm || (Array.isArray(pm) ? pm.length === 0 : !pm);
    });

    console.log(`[AI Processor] Found ${unprocessed.length} raw mentions awaiting AI processing.`);
    if (unprocessed.length === 0) {
      console.log('[AI Processor] No unprocessed mentions to classify. Ending cycle.');
      return;
    }

    let processedCount = 0;
    
    // El nivel gratuito de Gemini 1.5 Flash tiene un límite de 15 RPM (solicitudes por minuto).
    // Introducimos un delay de 4.5 segundos entre llamadas para garantizar que nos mantengamos
    // de forma segura por debajo de ese límite y evitemos errores 429 de Rate Limit.
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (const mention of unprocessed) {
      const { id: rawMentionId, brand_id: brandId, content_raw: contentRaw } = mention;
      console.log(`[AI Processor] Analyzing raw mention: ID ${rawMentionId}...`);

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: `Texto a procesar:\n${contentRaw}`,
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: sentimentResponseSchema
          }
        });

        const textResponse = response.text;
        if (!textResponse) {
          throw new Error('Empty response received from Gemini API');
        }

        const result = JSON.parse(textResponse);

        // 2. Registrar el resultado en processed_mentions
        const { error: insertError } = await supabase
          .from('processed_mentions')
          .insert({
            raw_mention_id: rawMentionId,
            brand_id: brandId,
            cleaned_content: result.cleaned_content,
            sentiment: result.sentiment,
            justification: result.justification,
            is_crisis_alert: result.is_crisis_alert
          });

        if (insertError) {
          console.error(`[AI Processor] Database insert error for raw mention ${rawMentionId}:`, insertError.message);
        } else {
          processedCount++;
          console.log(`[AI Processor] Classified mention ${rawMentionId} successfully: Sentiment=[${result.sentiment}] Crisis=[${result.is_crisis_alert}]`);
        }

      } catch (err: any) {
        console.error(`[AI Processor] Error analyzing mention ${rawMentionId}:`, err.message || err);
      }

      // Esperar antes del siguiente análisis
      await delay(4500);
    }

    console.log(`[AI Processor] Finished cycle. Classified: ${processedCount}/${unprocessed.length}`);

  } catch (error: any) {
    console.error('[AI Processor] Critical failure in processMentions:', error.message || error);
  }
}

// Ejecución directa si se invoca el script
if (require.main === module) {
  processMentions();
}
