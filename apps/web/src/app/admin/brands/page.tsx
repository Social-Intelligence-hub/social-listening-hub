import { createClient } from '@/utils/supabase/server'
import { addBrand, deleteBrand } from './actions'

export default async function BrandsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams?.error as string

  const supabase = await createClient()

  // Recuperar marcas ordenadas por creación
  const { data: brands, error: fetchError } = await supabase
    .from('brands')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Gestión de Marcas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Administra los clientes y marcas que el sistema rastrea activamente.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 text-red-200 rounded-xl text-sm backdrop-blur-md">
          ⚠️ {error}
        </div>
      )}

      {fetchError && (
        <div className="p-4 bg-red-950/30 border border-red-500/30 text-red-200 rounded-xl text-sm backdrop-blur-md">
          ⚠️ Error al cargar marcas: {fetchError.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Nueva Marca */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl h-fit space-y-4">
          <h2 className="text-lg font-semibold text-white">Añadir Nueva Marca</h2>
          <form action={addBrand} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Nombre de Marca / Cliente
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ej: Pepsi Dominicana"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all font-semibold rounded-xl text-sm text-white"
            >
              Crear Marca
            </button>
          </form>
        </div>

        {/* Listado de Marcas */}
        <div className="lg:col-span-2 bg-slate-900/30 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-lg font-semibold text-white">Marcas Registradas ({brands?.length || 0})</h2>
          </div>

          <div className="divide-y divide-slate-850">
            {brands && brands.length > 0 ? (
              brands.map((brand) => (
                <div key={brand.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-900/20 transition-all">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{brand.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {brand.id}</p>
                  </div>
                  <form action={deleteBrand}>
                    <input type="hidden" name="id" value={brand.id} />
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
                No hay marcas registradas en el sistema.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
