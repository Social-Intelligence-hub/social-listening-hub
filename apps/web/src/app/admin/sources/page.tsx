import { createClient } from '@/utils/supabase/server'
import { addSource, toggleSource, deleteSource } from './actions'
import Link from 'next/link'

export default async function SourcesPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const selectedBrandId = searchParams?.brand_id as string
  const error = searchParams?.error as string

  const supabase = await createClient()

  // Cargar lista de marcas
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('name', { ascending: true })

  // Cargar fuentes configuradas para la marca seleccionada
  let sources: any[] = []
  if (selectedBrandId) {
    const { data } = await supabase
      .from('sources_config')
      .select('*')
      .eq('brand_id', selectedBrandId)
      .order('created_at', { ascending: false })
    sources = data || []
  }

  // Mapear tipos de fuente para visualización amigable
  const sourceTypes = [
    { value: 'rss_google', label: 'Google Alerts RSS' },
    { value: 'rss_reddit', label: 'Reddit RSS Subreddit' },
    { value: 'url_scraping', label: 'URL Direct Scraping' },
    { value: 'youtube_channel', label: 'YouTube Channel Transcript' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Configuración de Fuentes de Ingesta
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configura y activa las fuentes externas (RSS, Web Scraping, YouTube) para la extracción automática.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 text-red-200 rounded-xl text-sm backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      {/* Selector de Marca */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Selecciona una Marca</h2>
        <div className="flex flex-wrap gap-2">
          {brands && brands.length > 0 ? (
            brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/admin/sources?brand_id=${brand.id}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  selectedBrandId === brand.id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {brand.name}
              </Link>
            ))
          ) : (
            <p className="text-sm text-slate-500">No hay marcas configuradas. Crea una marca primero para configurar fuentes.</p>
          )}
        </div>
      </div>

      {selectedBrandId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Nueva Fuente */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl h-fit space-y-4">
            <h2 className="text-lg font-semibold text-white">Configurar Fuente</h2>
            <form action={addSource} className="space-y-4">
              <input type="hidden" name="brand_id" value={selectedBrandId} />

              <div className="space-y-1">
                <label htmlFor="type" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Tipo de Fuente
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {sourceTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="url_target" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  URL Objetivo / Identificador
                </label>
                <input
                  id="url_target"
                  name="url_target"
                  type="text"
                  required
                  placeholder="https://ejemplo.com/rss o ID de canal"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-semibold rounded-xl text-sm text-white"
              >
                Guardar Fuente
              </button>
            </form>
          </div>

          {/* Listado de Fuentes */}
          <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-semibold text-white">Fuentes Activas ({sources.length})</h2>
            </div>

            <div className="divide-y divide-slate-850">
              {sources.length > 0 ? (
                sources.map((src) => (
                  <div key={src.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900/20 transition-all">
                    <div className="space-y-1 mr-4 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md text-[10px] font-mono">
                          {src.type}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${src.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                      </div>
                      <p className="text-xs font-mono text-slate-400 truncate">{src.url_target}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {/* Formulario Switch para alternar estado */}
                      <form action={toggleSource}>
                        <input type="hidden" name="id" value={src.id} />
                        <input type="hidden" name="brand_id" value={selectedBrandId} />
                        <input type="hidden" name="is_active" value={src.is_active ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            src.is_active
                              ? 'bg-emerald-950/20 hover:bg-emerald-950 border-emerald-900/30 hover:border-emerald-500/50 text-emerald-400'
                              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                          }`}
                        >
                          {src.is_active ? 'Activa' : 'Pausada'}
                        </button>
                      </form>

                      {/* Formulario para eliminar fuente */}
                      <form action={deleteSource}>
                        <input type="hidden" name="id" value={src.id} />
                        <input type="hidden" name="brand_id" value={selectedBrandId} />
                        <button
                          type="submit"
                          className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-950 border border-red-900/30 hover:border-red-500/50 text-red-400 text-xs font-semibold rounded-xl transition-all"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-550">
                  No hay fuentes de ingesta configuradas para esta marca.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
