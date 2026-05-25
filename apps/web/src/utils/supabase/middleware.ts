import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Inicializamos la respuesta para poder manipular sus cookies
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Creamos el cliente de SSR específicamente para el Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Primero actualizamos las cookies de la petición (para el resto del ciclo)
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          // Luego aplicamos las cookies a la respuesta que enviaremos al navegador
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Evita usar getSession(). getUser() es más seguro porque
  // viaja al servidor de Supabase para confirmar que el token siga activo.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Definimos qué rutas son cuáles
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin')
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/register')

  // 1. Redirigir a /login si no hay usuario pero busca entrar a zona privada
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Redirigir a /dashboard si YA HAY usuario y busca ir al /login o /register
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // =======================================================================
  // [LOGICA DE ROLES - SUGERIDA]
  // =======================================================================
  // Si deseas proteger la ruta /admin para que solo los "admin" entren, 
  // este es el momento y lugar perfecto. Aquí puedes hacer un select:
  // 
  // if (request.nextUrl.pathname.startsWith('/admin') && user) {
  //   const { data: userRole } = await supabase
  //     .from('user_brands') // O la tabla public.profiles según decidas
  //     .select('role')
  //     .eq('user_id', user.id)
  //     .single()
  //
  //   // Si no es admin, lo rebotamos al dashboard general
  //   if (userRole?.role !== 'admin') {
  //     const url = request.nextUrl.clone()
  //     url.pathname = '/dashboard'
  //     return NextResponse.redirect(url)
  //   }
  // }
  // =======================================================================

  return supabaseResponse
}
