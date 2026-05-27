import { createClient } from '@/utils/supabase/server'
import { addKeyword, deleteKeyword } from './actions'
import Link from 'next/link'

export default async function KeywordsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const selectedBrandId = searchParams?.brand_id as string
  const error = searchParams?.error as string

  const supabase = await createClient()

  // Cargar lista de marcas para el dropdown selector
  const { data: brands } = await supabase
    .from('brands')
    .select('*')
    .order('name', { ascending: true })

  // Cargar palabras clave vinculadas a la marca seleccionada
  let keywords: any[] = []
  if (selectedBrandId) {
    const { data } = await supabase
      .from('keywords')
      .select('*')
      .eq('brand_id', selectedBrandId)
      .order('created_at', { ascending: false })
    keywords = data || []
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Gestión de Palabras Clave (Keywords)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configura los términos de búsqueda principales y de exclusión para filtrar las menciones.
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
                href={`/admin/keywords?brand_id=${brand.id}`}
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
            <p className="text-sm text-slate-500">No hay marcas configuradas. Crea una marca primero para añadir keywords.</p>
          )}
        </div>
      </div>

      {selectedBrandId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de Nueva Palabra Clave */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl h-fit space-y-4">
            <h2 className="text-lg font-semibold text-white">Añadir Keyword</h2>
            <form action={addKeyword} className="space-y-4">
              <input type="hidden" name="brand_id" value={selectedBrandId} />

              <div className="space-y-1">
                <label htmlFor="term" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Término Principal (Obligatorio)
                </label>
                <input
                  id="term"
                  name="term"
                  type="text"
                  required
                  placeholder="Ej: presidente"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="exclusion_terms" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Exclusiones (Separadas por coma)
                </label>
                <input
                  id="exclusion_terms"
                  name="exclusion_terms"
                  type="text"
                  placeholder="Ej: venezuela, elecciones"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
                <p className="text-[10px] text-slate-500">
                  Cualquier mención que contenga estas palabras no será guardada.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-semibold rounded-xl text-sm text-white"
              >
                Crear Keyword
              </button>
            </form>
          </div>

          {/* Listado de Keywords de la marca */}
          <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="text-lg font-semibold text-white">Keywords Configuradas ({keywords.length})</h2>
            </div>

            <div className="divide-y divide-slate-850">
              {keywords.length > 0 ? (
                keywords.map((kw) => (
                  <div key={kw.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900/20 transition-all">
                    <div>
                      <span className="px-2.5 py-1 bg-indigo-950/50 text-indigo-300 border border-indigo-900/50 rounded-lg text-xs font-bold font-mono">
                        {kw.term}
                      </span>
                      {kw.exclusion_terms && kw.exclusion_terms.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mr-1">Excluye:</span>
                          {kw.exclusion_terms.map((ex: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 bg-red-950/30 text-red-400 border border-red-950 rounded-md text-[10px] font-mono">
                              {ex}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <form action={deleteKeyword}>
                      <input type="hidden" name="id" value={kw.id} />
                      <input type="hidden" name="brand_id" value={selectedBrandId} />
                      <button
                        type="submit"
                        className="px-3.5 py-1.5 bg-red-950/20 hover:bg-red-950 border border-red-900/30 hover:border-red-500/50 text-red-400 text-xs font-semibold rounded-xl transition-all"
                      >
                        Eliminar
                      </button>
                    </form>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-550">
                  No hay keywords configuradas para esta marca.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
