import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar rol 'admin' en el perfil público
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    // Si no es admin, redirigir al login o dashboard
    redirect('/login?error=true&message=Acceso+restringido+a+administradores')
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar de navegación */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between p-6">
        <div className="space-y-8">
          <div>
            <Link href="/admin" className="text-2xl font-black tracking-wider bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              SOCIAL Listening
            </Link>
            <p className="text-xs text-slate-500 mt-1 font-mono">PANEL DE CONTROL</p>
          </div>
          
          <nav className="space-y-2">
            <Link
              href="/admin/brands"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all font-medium border border-transparent hover:border-slate-700/50"
            >
              <span>🏢</span>
              <span>Gestión de Marcas</span>
            </Link>
            <Link
              href="/admin/keywords"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all font-medium border border-transparent hover:border-slate-700/50"
            >
              <span>🔑</span>
              <span>Palabras Clave</span>
            </Link>
            <Link
              href="/admin/sources"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white transition-all font-medium border border-transparent hover:border-slate-700/50"
            >
              <span>📡</span>
              <span>Fuentes de Ingesta</span>
            </Link>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              A
            </div>
            <div className="truncate">
              <p className="text-xs text-slate-500">Sesión iniciada como</p>
              <p className="text-sm font-semibold truncate text-slate-300">{user.email}</p>
            </div>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-center px-4 py-2.5 rounded-xl border border-red-900/50 bg-red-950/20 hover:bg-red-950/50 text-red-400 hover:text-red-300 text-sm font-medium transition-all"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Área de contenido */}
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  )
}
