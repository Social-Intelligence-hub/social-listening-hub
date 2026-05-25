import { login } from '../actions'
import Link from 'next/link'

// En Next.js 15, searchParams es asíncrono y debe desenvolver la promesa
export default async function LoginPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams?.error
  const message = searchParams?.message

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 px-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl transform transition-all">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Social Hub</h1>
          <p className="text-slate-300">Ingresa a tu cuenta para continuar</p>
        </div>
        
        {error && (
          <div className="p-4 text-sm font-medium text-red-200 bg-red-900/50 border border-red-500/30 rounded-xl backdrop-blur-sm">
            {message || 'Error al iniciar sesión'}
          </div>
        )}
        
        {!error && message && (
          <div className="p-4 text-sm font-medium text-emerald-200 bg-emerald-900/50 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
            {message}
          </div>
        )}

        <form action={login} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300" htmlFor="email">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="tu@empresa.com"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-300" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-3 text-white font-semibold bg-indigo-600 rounded-xl hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all duration-300 transform hover:-translate-y-1"
          >
            Entrar al Dashboard
          </button>
        </form>
        <p className="text-sm text-center text-slate-400">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
