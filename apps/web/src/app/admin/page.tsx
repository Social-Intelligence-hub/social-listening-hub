import { redirect } from 'next/navigation'

export default async function AdminPage() {
  // Redirigir por defecto al CRUD de marcas
  redirect('/admin/brands')
}
