const DDL_MIGRATION = `
-- 3. Tabla de Palabras Clave (Keywords de Configuración de Escucha)
CREATE TABLE IF NOT EXISTS public.keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  term TEXT NOT NULL,
  exclusion_terms TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de Configuración de Fuentes de Ingesta
DO $$ BEGIN
  CREATE TYPE source_type AS ENUM ('rss_google', 'rss_reddit', 'url_scraping', 'youtube_channel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.sources_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  type source_type NOT NULL,
  url_target TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de Menciones Crudas (Ingesta de Contenedor Worker cada 8 horas)
CREATE TABLE IF NOT EXISTS public.raw_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  source_name TEXT NOT NULL,
  content_raw TEXT NOT NULL,
  source_url TEXT,
  extracted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de Menciones Procesadas (Salida del Webhook de OpenAI Batch)
DO $$ BEGIN
  CREATE TYPE sentiment_type AS ENUM ('positivo', 'neutro', 'negativo');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.processed_mentions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  raw_mention_id UUID REFERENCES public.raw_mentions(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
  cleaned_content TEXT NOT NULL,
  sentiment sentiment_type NOT NULL,
  justification TEXT,
  is_crisis_alert BOOLEAN DEFAULT FALSE NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_mentions ENABLE ROW LEVEL SECURITY;

-- Políticas para perfiles (Admin y Client)
DROP POLICY IF EXISTS client_view_processed ON public.processed_mentions;
CREATE POLICY client_view_processed ON public.processed_mentions FOR SELECT TO authenticated USING (
  brand_id = (SELECT brand_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS admin_view_processed ON public.processed_mentions;
CREATE POLICY admin_view_processed ON public.processed_mentions FOR ALL TO authenticated USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
`;

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Sending migration DDL...');
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: DDL_MIGRATION });
  if (error) {
    console.error('Error executing DDL via RPC:', error.message);
  } else {
    console.log('DDL successfully applied!');
  }
}
run();
