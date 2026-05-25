import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // El middleware de Supabase se encarga tanto de refrescar tokens expirados 
  // como de aplicar las reglas de redirección (protección de rutas).
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Aplica el middleware a TODAS las rutas de la app, EXCEPTO aquellas 
     * que empiezan con:
     * - _next/static (archivos estáticos y código)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (ícono de la página)
     * También ignoramos extensiones estáticas (.svg, .png, .jpg, etc) 
     * para no gastar recursos de middleware en imágenes.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
